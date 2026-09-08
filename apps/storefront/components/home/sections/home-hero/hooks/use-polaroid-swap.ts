"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const frontRef = useRef(0);
  const leavingRef = useRef<number | null>(null);
  frontRef.current = front;
  leavingRef.current = leaving;

  useEffect(() => {
    const sync = () => setPageVisible(document.visibilityState === "visible");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  const goBy = useCallback(
    (step: number, animated = true) => {
      if (count < 2 || leavingRef.current !== null) return;
      const current = frontRef.current;
      const next = (current + step + count) % count;
      if (next === current) return;

      if (animated && !reduced) {
        leavingRef.current = current;
        setLeaving(current);
      }
      frontRef.current = next;
      setFront(next);
    },
    [count, reduced],
  );

  const goTo = useCallback(
    (index: number, animated = true) => {
      if (count < 2 || leavingRef.current !== null) return;
      const target = ((index % count) + count) % count;
      const current = frontRef.current;
      if (target === current) return;

      if (animated && !reduced) {
        leavingRef.current = current;
        setLeaving(current);
      }
      frontRef.current = target;
      setFront(target);
    },
    [count, reduced],
  );

  useEffect(() => {
    if (count < 2 || paused || !pageVisible || leaving !== null) return undefined;

    const id = window.setTimeout(() => goBy(1), POLAROID_INTERVAL_MS);
    return () => window.clearTimeout(id);
  }, [count, goBy, leaving, pageVisible, paused]);

  useEffect(() => {
    if (leaving === null) return undefined;
    const id = window.setTimeout(() => {
      leavingRef.current = null;
      setLeaving(null);
    }, POLAROID_LEAVE_MS);
    return () => window.clearTimeout(id);
  }, [leaving]);

  useEffect(() => {
    frontRef.current = 0;
    leavingRef.current = null;
    setFront(0);
    setLeaving(null);
  }, [count]);

  return {
    front,
    leaving,
    goNext: () => goBy(1),
    goPrev: () => goBy(-1),
    goTo,
  };
}
