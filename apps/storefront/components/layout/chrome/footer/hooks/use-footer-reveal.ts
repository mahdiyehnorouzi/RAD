"use client";

import { useEffect, useRef } from "react";

/**
 * Adds `is-in` the first time the element scrolls into view. The hidden start
 * state only applies once the element has `data-motion="live"`, so without
 * JavaScript or under reduced motion everything is simply shown.
 */
export function useFooterReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        node.classList.add("is-in");
        observer.disconnect();
      },
      { threshold: 0.6 },
    );

    node.dataset.motion = "live";
    observer.observe(node);

    return () => {
      observer.disconnect();
      delete node.dataset.motion;
    };
  }, []);

  return ref;
}
