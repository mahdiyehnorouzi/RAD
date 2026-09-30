"use client";

import { useEffect, useRef, useState } from "react";

/**
 * `pinned` is true on small screens while the heading has scrolled up under
 * the header and the rest of its section is still on screen.
 */
export function useStickyPin(topCssVar = "--header-height", maxWidth = 900) {
  const containerRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLElement>(null);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const heading = headingRef.current;
    if (!container || !heading) return undefined;

    let frame = 0;
    const query = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const topOffset = () => {
      const raw = getComputedStyle(document.documentElement).getPropertyValue(
        topCssVar,
      );
      return parseFloat(raw) || 104;
    };

    const update = () => {
      if (!query.matches) {
        setPinned(false);
        return;
      }
      const top = topOffset();
      const passedHeading = heading.getBoundingClientRect().bottom <= top + 1;
      const stillInSection =
        container.getBoundingClientRect().bottom > top + 120;
      const next = passedHeading && stillInSection;
      setPinned((current) => (current === next ? current : next));
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    update();
    query.addEventListener("change", onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      query.removeEventListener("change", onScroll);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [maxWidth, topCssVar]);

  return { containerRef, headingRef, pinned };
}
