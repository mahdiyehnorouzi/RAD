"use client";

import { useEffect, type RefObject } from "react";

/**
 * Marks each `[data-reveal]` inside the container with `is-in` the first time
 * it scrolls into view. Hidden start states only apply once the container has
 * `data-motion="live"`, so without JavaScript or under reduced motion every
 * element is simply shown.
 */
export function useRevealOnce(containerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -15% 0px", threshold: 0.2 },
    );

    container.dataset.motion = "live";
    container.querySelectorAll("[data-reveal]").forEach((target) => observer.observe(target));

    return () => {
      observer.disconnect();
      delete container.dataset.motion;
    };
  }, [containerRef]);
}
