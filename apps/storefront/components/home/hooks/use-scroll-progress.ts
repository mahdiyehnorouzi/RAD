"use client";

import { useEffect, useRef, useState } from "react";

export function useScrollProgress<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setProgress(1);
      return undefined;
    }

    const update = () => {
      const rect = node.getBoundingClientRect();
      const view = window.innerHeight;
      const start = view * 0.7;
      const end = view * 0.28;
      const range = Math.max(1, rect.height + start - end);
      const next = Math.min(1, Math.max(0, (start - rect.top) / range));
      setProgress(next);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return { ref, progress };
}
