"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { create } from "zustand";
import type { AuthUser } from "@rad/types";
import type { MakingCommission } from "@/components/making/type";
import { isDemoCommission, seedCommissions } from "@/lib/making";
import {
  addCommissionMessage,
  addWorkshopCommissionMessage,
  COMMISSION_UPLOAD_IMAGES,
  createCommission,
  fetchMyCommissions,
  fetchWorkshopCommissions,
  saveCommission,
  saveWorkshopCommission,
  slimCommissionBrief,
} from "@/lib/api";
import {
  createMakingActions,
  type MakingActions,
} from "@/hooks/making-actions";
import { useCommerce } from "@/components/commerce";
import { logRecovered } from "@/lib/log";

type MakingContextValue = Omit<MakingActions, "submitDesign"> & {
  ready: boolean;
  mode: "customer" | "maker";
  commissions: MakingCommission[];
  get: (id: string) => MakingCommission | undefined;
  submitDesign: (
    input: Parameters<MakingActions["submitDesign"]>[0],
  ) => Promise<MakingCommission>;
};

const MakingContext = createContext<MakingContextValue | null>(null);

type CommissionLookup = (id: string) => MakingCommission | undefined;
const noCommission: CommissionLookup = () => undefined;

/**
 * MakingProvider only wraps the routes that need it; the route trail renders
 * in the root layout, outside it, and reads commission titles from here.
 */
const useCommissionIndex = create<{ get: CommissionLookup }>(() => ({
  get: noCommission,
}));

function isMaker(user: AuthUser | null) {
  if (!user) return false;
  return (
    user.role === "artist" ||
    user.adminRole === "owner" ||
    user.adminRole === "manager" ||
    user.adminRole === "editor"
  );
}

export function MakingProvider({ children }: { children: ReactNode }) {
  const { user } = useCommerce();
  const maker = isMaker(user);
  return (
    <MakingSession key={`${user?.id ?? "guest"}:${maker}`} maker={maker}>
      {children}
    </MakingSession>
  );
}

function MakingSession({
  children,
  maker,
}: {
  children: ReactNode;
  maker: boolean;
}) {
  const [commissions, setCommissions] = useState<MakingCommission[]>([]);
  const [ready, setReady] = useState(false);

  const loadRemote = useCallback(async () => {
    try {
      const remote = maker
        ? await fetchWorkshopCommissions()
        : await fetchMyCommissions();
      if (Array.isArray(remote)) {
        setCommissions((current) => mergeCommissions(current, remote));
      }
    } catch (error) {
      logRecovered("commissions", error);
    }
  }, [maker]);

  useEffect(() => {
    let cancelled = false;
    void loadRemote().finally(() => {
      if (!cancelled) setReady(true);
    });
    const onFocus = () => {
      void loadRemote();
    };
    window.addEventListener("focus", onFocus);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadRemote();
    }, 12_000);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      window.clearInterval(timer);
    };
  }, [loadRemote]);

  const saveQueues = useRef(new Map<string, Promise<unknown>>());

  const update = useCallback(
    (id: string, map: (current: MakingCommission) => MakingCommission) => {
      setCommissions((current) => {
        const next = current.map((item) => (item.id === id ? map(item) : item));
        const changed = next.find((item) => item.id === id);
        if (changed && !isDemoCommission(id)) {
          const save = maker ? saveWorkshopCommission : saveCommission;
          const previous = saveQueues.current.get(id) ?? Promise.resolve();
          const queued = previous
            .catch(() => undefined)
            .then(() => save(id, changed));
          saveQueues.current.set(id, queued);
        }
        return next;
      });
    },
    [maker],
  );

  const actions = useMemo(
    () => createMakingActions(update, setCommissions),
    [update],
  );

  // Only confirmed messages enter the history. The composer owns the
  // pending draft and its stable retry ID, not the server-state cache.
  const sendMessage = useCallback(
    async (id: string, input: Parameters<MakingActions["addMessage"]>[1]) => {
      if (isDemoCommission(id)) {
        return actions.addMessage(id, input);
      }
      const saved = maker
        ? await addWorkshopCommissionMessage(id, {
            body: input.body,
            internal: input.internal,
            operationId: input.operationId,
          })
        : await addCommissionMessage(id, {
            body: input.body,
            operationId: input.operationId,
          });
      setCommissions((current) => mergeCommissions(current, [saved]));
    },
    [actions, maker],
  );

  const submitDesign = useCallback(
    async (input: Parameters<MakingActions["submitDesign"]>[0]) => {
      const slimInput = {
        ...input,
        brief: slimCommissionBrief(input.brief, COMMISSION_UPLOAD_IMAGES),
      };
      const saved = await createCommission(slimInput);
      setCommissions((current) => [
        saved,
        ...current.filter((item) => item.id !== saved.id),
      ]);
      return saved;
    },
    [],
  );

  const value = useMemo<MakingContextValue>(
    () => ({
      ready,
      mode: maker ? "maker" : "customer",
      commissions,
      get: (id) =>
        commissions.find((item) => item.id === id) ??
        (!maker ? seedCommissions.find((item) => item.id === id) : undefined),
      ...actions,
      addMessage: sendMessage,
      submitDesign,
    }),
    [actions, commissions, maker, ready, sendMessage, submitDesign],
  );

  useEffect(() => {
    useCommissionIndex.setState({ get: value.get });
    return () => useCommissionIndex.setState({ get: noCommission });
  }, [value.get]);

  return (
    <MakingContext.Provider value={value}>{children}</MakingContext.Provider>
  );
}

export function useMaking() {
  const value = useContext(MakingContext);
  if (!value) throw new Error("useMaking must be used inside MakingProvider");
  return value;
}

/** Finds a loaded commission from anywhere; `undefined` outside the making routes. */
export function useCommissionLookup() {
  return useCommissionIndex((state) => state.get);
}

function mergeCommissions(
  local: MakingCommission[],
  remote: MakingCommission[],
) {
  const byId = new Map(local.map((item) => [item.id, item]));
  for (const item of remote) {
    const existing = byId.get(item.id);
    if (!existing || item.updatedAt > existing.updatedAt)
      byId.set(item.id, item);
  }
  return [...byId.values()].sort((a, b) => b.updatedAt - a.updatedAt);
}
