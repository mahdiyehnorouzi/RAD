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
import type { MakingCommission } from "@/components/making/type";
import { createSubmittedCommission, seedCommissions } from "@/lib/making";
import { createCommission, fetchMyCommissions, saveCommission } from "@/lib/api";
import { createMakingActions, type MakingActions } from "@/hooks/making-actions";

const storageKey = "rad-making-commissions";

type MakingContextValue = Omit<MakingActions, "submitDesign"> & {
  ready: boolean;
  commissions: MakingCommission[];
  get: (id: string) => MakingCommission | undefined;
  submitDesign: (
    input: Parameters<MakingActions["submitDesign"]>[0],
  ) => Promise<MakingCommission>;
};

const MakingContext = createContext<MakingContextValue | null>(null);

export function MakingProvider({ children }: { children: ReactNode }) {
  const [commissions, setCommissions] = useState<MakingCommission[]>([]);
  const [ready, setReady] = useState(false);

  const loadRemote = useCallback(async () => {
    try {
      const remote = await fetchMyCommissions();
      if (Array.isArray(remote) && remote.length) {
        setCommissions((current) => mergeCommissions(current, remote));
        return true;
      }
    } catch {}
    return false;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const local = readLocal();
    (async () => {
      const remote = await fetchMyCommissions().catch(() => [] as MakingCommission[]);
      if (cancelled) return;
      const seedIds = new Set(seedCommissions.map((item) => item.id));
      if (remote.length) {
        setCommissions(mergeCommissions(local.filter((item) => !seedIds.has(item.id)), remote));
      } else if (local.length) setCommissions(local);
      else setCommissions(seedCommissions);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(commissions));
    } catch {}
  }, [commissions, ready]);

  useEffect(() => {
    const onFocus = () => {
      void loadRemote();
    };
    window.addEventListener("focus", onFocus);
    const timer = window.setInterval(() => void loadRemote(), 8000);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(timer);
    };
  }, [loadRemote]);

  const update = useCallback((id: string, map: (current: MakingCommission) => MakingCommission) => {
    setCommissions((current) => {
      const next = current.map((item) => (item.id === id ? map(item) : item));
      const changed = next.find((item) => item.id === id);
      if (changed) void saveCommission(id, changed).catch(() => {});
      return next;
    });
  }, []);

  const actions = useMemo(() => createMakingActions(update, setCommissions), [update]);

  const submitDesign = useCallback(async (input: Parameters<MakingActions["submitDesign"]>[0]) => {
    try {
      const saved = await createCommission(input);
      setCommissions((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      return saved;
    } catch {
      const created = createSubmittedCommission(input);
      setCommissions((current) => [created, ...current]);
      return created;
    }
  }, []);

  const value = useMemo<MakingContextValue>(
    () => ({
      ready,
      commissions,
      get: (id) => commissions.find((item) => item.id === id),
      ...actions,
      submitDesign,
    }),
    [actions, commissions, ready, submitDesign],
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
    const raw = window.localStorage.getItem(storageKey);
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
