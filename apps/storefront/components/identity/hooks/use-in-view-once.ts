"use client";

import { useEffect, useRef, useState } from "react";

/** Flips to true the first time the element is seen and stays there. */
export function useInViewOnce<T extends Element>(enabled = true) {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!enabled || !node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setSeen(true);
        observer.disconnect();
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled]);

  return { ref, seen };
}
