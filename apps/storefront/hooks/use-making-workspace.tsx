"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser } from "@rad/types";
import type { MakingCommission } from "@/components/making/type";
import { isDemoCommission, seedCommissions } from "@/lib/making";
import {
  createCommission,
  fetchMyCommissions,
  fetchWorkshopCommissions,
  saveCommission,
  saveWorkshopCommission,
  slimCommissionBrief,
} from "@/lib/api";
import { createMakingActions, type MakingActions } from "@/hooks/making-actions";
import { useCommerce } from "@/components/commerce";

const storageKey = "rad-making-commissions-v2";

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

function isMaker(user: AuthUser | null) {
  if (!user) return false;
  return (
    user.role === "artist" ||
    user.adminRole === "owner" ||
    user.adminRole === "manager" ||
    user.adminRole === "editor"
  );
}

function persistable(commissions: MakingCommission[]) {
  return commissions.map((item) => ({
    ...item,
    brief: slimCommissionBrief(item.brief),
  }));
}

export function MakingProvider({ children }: { children: ReactNode }) {
  const { user } = useCommerce();
  const maker = isMaker(user);
  const [commissions, setCommissions] = useState<MakingCommission[]>([]);
  const [ready, setReady] = useState(false);

  const loadRemote = useCallback(async () => {
    try {
      const remote = maker ? await fetchWorkshopCommissions() : await fetchMyCommissions();
      if (Array.isArray(remote)) {
        setCommissions((current) =>
          maker ? remote : mergeCommissions(current.filter((item) => !isDemoCommission(item.id)), remote),
        );
        return true;
      }
    } catch {
      /* keep local */
    }
    return false;
  }, [maker]);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    const local = maker ? [] : readLocal();
    (async () => {
      const remote = await (maker ? fetchWorkshopCommissions() : fetchMyCommissions()).catch(
        () => [] as MakingCommission[],
      );
      if (cancelled) return;
      if (maker) setCommissions(remote);
      else {
        const seedIds = new Set(seedCommissions.map((item) => item.id));
        const owned = local.filter((item) => !seedIds.has(item.id));
        setCommissions(remote.length ? mergeCommissions(owned, remote) : owned);
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [maker, user?.id]);

  useEffect(() => {
    if (!ready || maker) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(persistable(commissions)));
    } catch {
      /* quota */
    }
  }, [commissions, ready, maker]);

  useEffect(() => {
    const onFocus = () => {
      void loadRemote();
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("rad:session", onFocus);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadRemote();
    }, 12_000);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("rad:session", onFocus);
      window.clearInterval(timer);
    };
  }, [loadRemote]);

  const update = useCallback(
    (id: string, map: (current: MakingCommission) => MakingCommission) => {
      setCommissions((current) => {
        const next = current.map((item) => (item.id === id ? map(item) : item));
        const changed = next.find((item) => item.id === id);
        if (changed && !isDemoCommission(id)) {
          const save = maker ? saveWorkshopCommission : saveCommission;
          void save(id, changed).catch(() => {});
        }
        return next;
      });
    },
    [maker],
  );

  const actions = useMemo(() => createMakingActions(update, setCommissions), [update]);

  const submitDesign = useCallback(
    async (input: Parameters<MakingActions["submitDesign"]>[0]) => {
      const slimInput = { ...input, brief: slimCommissionBrief(input.brief) };
      const saved = await createCommission(slimInput);
      setCommissions((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
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
      submitDesign,
    }),
    [actions, commissions, maker, ready, submitDesign],
  );

  return <MakingContext.Provider value={value}>{children}</MakingContext.Provider>;
}

export function useMaking() {
  const value = useContext(MakingContext);
  if (!value) throw new Error("useMaking must be used inside MakingProvider");
  return value;
}

function readLocal(): MakingCommission[] {
  try {
    const raw = window.localStorage.getItem(storageKey) ?? window.localStorage.getItem("rad-making-commissions");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MakingCommission[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mergeCommissions(local: MakingCommission[], remote: MakingCommission[]) {
  const byId = new Map(local.map((item) => [item.id, item]));
  for (const item of remote) {
    const existing = byId.get(item.id);
    if (!existing || item.updatedAt >= existing.updatedAt) byId.set(item.id, item);
  }
  return [...byId.values()].sort((a, b) => b.updatedAt - a.updatedAt);
}
