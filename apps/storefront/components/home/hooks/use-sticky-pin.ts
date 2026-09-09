"use client";

import { useEffect, useRef, useState } from "react";

export function useStickyPin<T extends HTMLElement = HTMLElement>(
  topCssVar = "--header-height",
) {
  const ref = useRef<T>(null);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    let frame = 0;
    const topOffset = () => {
      const raw = getComputedStyle(document.documentElement).getPropertyValue(
        topCssVar,
      );
      return parseFloat(raw) || 104;
    };

    const update = () => {
      const next = node.getBoundingClientRect().bottom <= topOffset() + 1;
      setPinned((current) => (current === next ? current : next));
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
  }, [topCssVar]);

  return { ref, pinned };
}
