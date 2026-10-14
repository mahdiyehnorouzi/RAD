"use client";

import { useCallback, useEffect, useRef } from "react";

/** Extra breathing room (px) below the sticky header/stepper's measured
 * bottom edge before a revealed section's heading starts. */
const BREATHING_ROOM = 20;

/**
 * Lets a scroll-driven flow register section elements by id, register the
 * sticky header/stepper that overlays the top of the viewport, and smoothly
 * bring a section into view just below that overlay.
 *
 * The offset is never hardcoded: it's measured from the sticky element's own
 * `getBoundingClientRect().bottom` at scroll time, so it stays correct
 * across breakpoints and if the header's height ever changes. The actual
 * scroll only runs after two animation frames have passed, which guarantees
 * the browser has committed and laid out whatever section expanded or
 * collapsed just before this was called — collapsing a section to its
 * summary row and expanding the next one both change layout synchronously
 * (no CSS height transition), so there is nothing further to wait for; the
 * `section-in` opacity/transform animation that follows doesn't affect
 * layout, so it does not need to finish first.
 *
 * Respects prefers-reduced-motion, cancels a still-pending scroll before
 * scheduling a new one (no competing scroll operations, no double-trigger
 * jitter from rapid re-renders), and cleans up on unmount.
 */
export function useScrollToSection() {
  const elements = useRef<Partial<Record<string, HTMLElement | null>>>({});
  const sticky = useRef<HTMLElement | null>(null);
  const frames = useRef<[number, number] | null>(null);
  const alive = useRef(true);

  useEffect(
    () => () => {
      alive.current = false;
      cancelPending();
    },
    [],
  );

  function cancelPending() {
    if (frames.current) {
      cancelAnimationFrame(frames.current[0]);
      cancelAnimationFrame(frames.current[1]);
      frames.current = null;
    }
  }

  const register = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      elements.current[id] = el;
    },
    [],
  );

  const registerSticky = useCallback((el: HTMLElement | null) => {
    sticky.current = el;
  }, []);

  const scrollToSection = useCallback((id: string) => {
    cancelPending();
    // One frame for the triggering state update to commit and lay out,
    // a second so we measure after the browser has actually reflowed
    // (a single rAF can still land before layout on some engines).
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        frames.current = null;
        if (!alive.current) return;
        const el = elements.current[id];
        if (!el) return;
        const stickyBottom = sticky.current
          ? Math.max(0, sticky.current.getBoundingClientRect().bottom)
          : 0;
        const targetTop = el.getBoundingClientRect().top;
        const offset = stickyBottom + BREATHING_ROOM;
        const destination = window.scrollY + targetTop - offset;
        const reducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        window.scrollTo({
          top: Math.max(0, destination),
          behavior: reducedMotion ? "instant" : "smooth",
        });
      });
      frames.current = [raf1, raf2];
    });
    frames.current = [raf1, raf1];
  }, []);

  return { register, registerSticky, scrollToSection };
}
