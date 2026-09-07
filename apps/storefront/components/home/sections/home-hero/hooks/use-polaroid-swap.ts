"use client";

import { useEffect, useState } from "react";
import { POLAROID_INTERVAL_MS, POLAROID_LEAVE_MS } from "@/components/home/const";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return reduced;
}

export function usePolaroidSwap(count: number, paused = false) {
  const reduced = usePrefersReducedMotion();
  const [pageVisible, setPageVisible] = useState(true);
  const [front, setFront] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);

  useEffect(() => {
    const sync = () => setPageVisible(document.visibilityState === "visible");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  useEffect(() => {
    if (count < 2 || paused || !pageVisible || leaving !== null) return undefined;

    const id = window.setTimeout(() => {
      setFront((current) => {
        if (!reduced) setLeaving(current);
        return (current + 1) % count;
      });
    }, POLAROID_INTERVAL_MS);

    return () => window.clearTimeout(id);
  }, [count, leaving, pageVisible, paused, reduced]);

  useEffect(() => {
    if (leaving === null) return undefined;
    const id = window.setTimeout(() => setLeaving(null), POLAROID_LEAVE_MS);
    return () => window.clearTimeout(id);
  }, [leaving]);

  useEffect(() => {
    setFront(0);
    setLeaving(null);
  }, [count]);

  return { front, leaving };
}
