"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
} from "motion/react";

/**
 * Drives a vertical step list from scroll: progress is scoped to this list's
 * own scroll range (not the whole page), smoothed, and mapped onto the
 * markers' real rendered positions (measured, never assumed evenly spaced).
 * Returns the motion value to drive the fill line's `scaleY` and the index
 * of the furthest-reached step, which only updates on an actual change so
 * steps don't re-render on every scroll tick.
 */
export function useVerticalStepper(stepCount: number) {
  const containerRef = useRef<HTMLOListElement>(null);
  const markerRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [track, setTrack] = useState({ top: 0, height: 0 });
  const fractionsRef = useRef<number[]>([]);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.82", "end 0.4"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: reduceMotion ? 1000 : 140,
    damping: reduceMotion ? 100 : 26,
    mass: 0.55,
  });

  useLayoutEffect(() => {
    const measure = () => {
      const container = containerRef.current;
      const markers = markerRefs.current.slice(0, stepCount);
      if (!container || markers.some((marker) => !marker)) return;
      const containerBox = container.getBoundingClientRect();
      const centres = markers.map(
        (marker) =>
          marker!.getBoundingClientRect().top +
          marker!.getBoundingClientRect().height / 2 -
          containerBox.top,
      );
      const first = centres[0] ?? 0;
      const last = centres[centres.length - 1] ?? 0;
      const span = Math.max(1, last - first);
      fractionsRef.current = centres.map((y) => (y - first) / span);
      setTrack({ top: first, height: span });
    };

    measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => {
      window.removeEventListener("resize", onResize);
      ro.disconnect();
    };
  }, [stepCount]);

  useMotionValueEvent(progress, "change", (value) => {
    const fractions = fractionsRef.current;
    if (!fractions.length) return;
    let next = 0;
    for (let index = 0; index < fractions.length; index += 1) {
      if (value >= fractions[index] - 0.001) next = index;
    }
    setActive((prev) => (prev === next ? prev : next));
  });

  return { containerRef, markerRefs, progress, active, track };
}
