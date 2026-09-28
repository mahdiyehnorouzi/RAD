"use client";

import { useCallback, useEffect, useState } from "react";
import { HERO_CARD_BACK_MS, HERO_CARD_FRONT_MS } from "@/components/home/const";

type CycleState = {
  active: number;
  /** The centre card before the last move, so a card wrapping round can travel behind the fan. */
  from: number;
  turned: boolean;
};

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

function usePageVisible() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const sync = () => setVisible(document.visibilityState === "visible");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  return visible;
}

const wrap = (index: number, count: number) => ((index % count) + count) % count;

/** Photograph, then its record, then the next work: one turn and one pass per beat. */
export function useHeroCycle(count: number, paused: boolean) {
  const reduced = usePrefersReducedMotion();
  const pageVisible = usePageVisible();
  const [state, setState] = useState<CycleState>({ active: 0, from: 0, turned: false });
  const playing = count > 1 && !paused && pageVisible && !reduced;

  const goTo = useCallback(
    (index: number) =>
      setState((current) => {
        const target = wrap(index, count);
        if (target === current.active) return current;
        return { active: target, from: current.active, turned: false };
      }),
    [count],
  );

  const step = useCallback(
    (delta: number) =>
      setState((current) => ({
        active: wrap(current.active + delta, count),
        from: current.active,
        turned: false,
      })),
    [count],
  );

  const turn = useCallback(
    () =>
      setState((current) => ({
        ...current,
        from: current.active,
        turned: !current.turned,
      })),
    [],
  );

  useEffect(() => {
    if (!playing) return undefined;
    const id = window.setTimeout(
      () => (state.turned ? step(1) : turn()),
      state.turned ? HERO_CARD_BACK_MS : HERO_CARD_FRONT_MS,
    );
    return () => window.clearTimeout(id);
  }, [playing, state, step, turn]);

  return {
    active: state.active,
    from: state.from,
    turned: state.turned,
    autoplay: count > 1 && !reduced,
    goTo,
    next: () => step(1),
    prev: () => step(-1),
    turn,
  };
}
