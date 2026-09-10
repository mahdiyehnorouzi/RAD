"use client";

import { useCallback, useEffect, useState } from "react";

export function useScrollStage(count: number) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const ref = useCallback((element: HTMLDivElement | null) => {
    setNode(element);
  }, []);

  useEffect(() => {
    if (!node || count < 1) return undefined;

    let frame = 0;
    const update = () => {
      const range = node.offsetHeight - window.innerHeight;
      if (range <= 0) {
        setStage(0);
        setProgress(0);
        return;
      }
      const start = node.getBoundingClientRect().top + window.scrollY;
      const next = Math.min(1, Math.max(0, (window.scrollY - start) / range));
      setProgress(next);
      setStage(Math.min(count - 1, Math.floor(next * (count - 0.001))));
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [count, node]);

  return { ref, stage, progress };
}
