"use client";

import { useEffect, useRef, useState } from "react";

const SCAN_HOLD_MS = 2400;

/**
 * Touch screens have no hover, so the scan plays once when the code is fully
 * in view, holds the check for a beat, then hands the code back. Pointer
 * devices play it on hover and focus instead.
 */
export function useScanOnView<T extends Element>() {
  const ref = useRef<T | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || !window.matchMedia("(hover: none)").matches) return;
    let timer: number | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        setScanned(true);
        timer = window.setTimeout(() => setScanned(false), SCAN_HOLD_MS);
      },
      { threshold: 1, rootMargin: "0px 0px -12% 0px" },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  return { ref, scanned };
}
