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
import { seedCommissions } from "@/lib/making";
import { createMakingActions, type MakingActions } from "@/hooks/making-actions";

const storageKey = "rad-making-commissions";

type MakingContextValue = MakingActions & {
  ready: boolean;
  commissions: MakingCommission[];
  get: (id: string) => MakingCommission | undefined;
};

const MakingContext = createContext<MakingContextValue | null>(null);

export function MakingProvider({ children }: { children: ReactNode }) {
  const [commissions, setCommissions] = useState<MakingCommission[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as MakingCommission[];
        if (Array.isArray(parsed) && parsed.length) {
          setCommissions(parsed);
          setReady(true);
          return;
        }
      }
    } catch {}
    setCommissions(seedCommissions);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(commissions));
    } catch {}
  }, [commissions, ready]);

  const update = useCallback((id: string, map: (current: MakingCommission) => MakingCommission) => {
    setCommissions((current) => current.map((item) => (item.id === id ? map(item) : item)));
  }, []);

  const actions = useMemo(() => createMakingActions(update, setCommissions), [update]);

  const value = useMemo<MakingContextValue>(
    () => ({
      ready,
      commissions,
      get: (id) => commissions.find((item) => item.id === id),
      ...actions,
    }),
    [actions, commissions, ready],
  );

  return <MakingContext.Provider value={value}>{children}</MakingContext.Provider>;
}

export function useMaking() {
  const value = useContext(MakingContext);
  if (!value) throw new Error("useMaking must be used inside MakingProvider");
  return value;
}
