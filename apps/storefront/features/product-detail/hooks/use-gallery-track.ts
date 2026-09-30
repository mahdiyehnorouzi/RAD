import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

/**
 * One scroll-snapped track drives the gallery, so touch swipe, arrows,
 * thumbnails and the keyboard all agree on the active slide. RTL tracks report
 * a negative `scrollLeft`, hence the direction sign.
 */
export function useGalleryTrack(count: number) {
  const trackRef = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const [active, setActive] = useState(0);

  const goTo = useCallback(
    (index: number) => {
      const track = trackRef.current;
      if (!track) return;
      const next = Math.min(Math.max(index, 0), count - 1);
      const sign = getComputedStyle(track).direction === "rtl" ? -1 : 1;
      const still = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      track.scrollTo({
        left: sign * next * track.clientWidth,
        behavior: still ? "auto" : "smooth",
      });
      setActive(next);
    },
    [count],
  );

  const onScroll = useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const track = trackRef.current;
      if (!track?.clientWidth) return;
      setActive(Math.round(Math.abs(track.scrollLeft) / track.clientWidth));
    });
  }, []);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const rtl =
        trackRef.current &&
        getComputedStyle(trackRef.current).direction === "rtl";
      const forward = (event.key === "ArrowLeft") === Boolean(rtl);
      event.preventDefault();
      goTo(active + (forward ? 1 : -1));
    },
    [active, goTo],
  );

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  useEffect(() => {
    if (active > count - 1) goTo(count - 1);
  }, [active, count, goTo]);

  return { trackRef, active, goTo, onScroll, onKeyDown };
}
