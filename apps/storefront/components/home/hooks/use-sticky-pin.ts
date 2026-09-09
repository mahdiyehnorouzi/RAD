"use client";

import { useEffect, useRef, useState } from "react";

export function useStickyPin(topCssVar = "--header-height") {
  const containerRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLElement>(null);
  const [pinned, setPinned] = useState(false);
  const [barHeight, setBarHeight] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    const heading = headingRef.current;
    if (!container || !heading) return undefined;

    let frame = 0;
    const topOffset = () => {
      const raw = getComputedStyle(document.documentElement).getPropertyValue(
        topCssVar,
      );
      return parseFloat(raw) || 104;
    };

    const update = () => {
      const top = topOffset();
      const headingBox = heading.getBoundingClientRect();
      const containerBox = container.getBoundingClientRect();
      const stillInSection = containerBox.bottom > top + headingBox.height - 1;
      const reachedPin = headingBox.top <= top + 1;
      const next = reachedPin && stillInSection;
      setPinned((current) => (current === next ? current : next));
      setBarHeight(headingBox.height);
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

  return { containerRef, headingRef, pinned, barHeight };
}
