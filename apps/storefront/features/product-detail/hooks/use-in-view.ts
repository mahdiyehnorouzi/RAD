import { useEffect, useRef, useState } from "react";

/**
 * Tracks whether the returned ref's element currently intersects the
 * viewport, via a single IntersectionObserver (not a scrollY threshold) —
 * used to gate the floating purchase bar strictly off the inline CTA's own
 * visibility rather than an arbitrary pixel offset.
 */
export function useInView<T extends HTMLElement>(rootMargin = "0px") {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? true),
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  return { ref, inView };
}
