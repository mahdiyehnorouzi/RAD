"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../lib/api";

export function useStaffNoticeReads(userId: string | undefined) {
  const [snapshot, setSnapshot] = useState<{
    userId: string;
    keys: Set<string>;
  } | null>(null);
  const pending = useRef(new Set<string>());
  const owner = useRef(userId);
  useEffect(() => {
    owner.current = userId;
    pending.current.clear();
    if (!userId) return;
    let cancelled = false;
    const refresh = () => {
      void api<string[]>("/admin/notice-reads")
        .then((keys) => {
          if (cancelled) return;
          setSnapshot((current) => ({
            userId,
            keys: new Set([
              ...keys,
              ...(current?.userId === userId ? current.keys : []),
            ]),
          }));
        })
        .catch(() => {});
    };
    refresh();
    const timer = window.setInterval(refresh, 20_000);
    window.addEventListener("focus", refresh);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [userId]);

  const markRead = useCallback(
    async (key: string) => {
      if (!userId || owner.current !== userId || pending.current.has(key))
        return;
      pending.current.add(key);
      try {
        await api("/admin/notice-reads", {
          method: "POST",
          body: JSON.stringify({ key }),
        });
        if (owner.current !== userId) return;
        setSnapshot((current) => ({
          userId,
          keys: new Set([
            ...(current?.userId === userId ? current.keys : []),
            key,
          ]),
        }));
      } finally {
        if (owner.current === userId) pending.current.delete(key);
      }
    },
    [userId],
  );

  return {
    ready: snapshot?.userId === userId,
    keys: snapshot?.userId === userId ? snapshot?.keys : undefined,
    markRead,
  };
}
