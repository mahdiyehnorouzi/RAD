import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

/**
 * One scroll-snapped track drives the gallery, so touch swipe, arrows,
 * thumbnails and the keyboard all agree on the active slide. RTL tracks report
 * a negative `scrollLeft`, hence the direction sign.
 */
export function useGalleryTrack(count: number) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const goTo = useCallback(
    (index: number, options?: { animate?: boolean }) => {
      const track = trackRef.current;
      if (!track) return;
      const next = Math.min(Math.max(index, 0), count - 1);
      const sign = getComputedStyle(track).direction === "rtl" ? -1 : 1;
      const still = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      // `animate: false` (the lightbox's own Next/Previous — see
      // pdp-lightbox.tsx) skips the smooth-scroll animation on this track
      // entirely. The lightbox has its own slide shown fullscreen; this
      // track sits hidden behind it the whole time it's open, so animating
      // it was pure wasted compositor/scroll work on every click — worse,
      // a rapid run of clicks queued overlapping smooth-scrolls that each
      // fired their own `onScroll`-driven re-render, which is what the
      // reported freeze during fast Next/Previous actually was. An instant
      // `behavior: "auto"` jump keeps this track correctly positioned for
      // the moment the lightbox closes, without the animation or the
      // scroll-event storm.
      track.scrollTo({
        left: sign * next * track.clientWidth,
        behavior: still || options?.animate === false ? "auto" : "smooth",
      });
      setActive(next);
    },
    [count],
  );

  // Computed synchronously, directly from the fired scroll event — no
  // requestAnimationFrame indirection (that deferred the index update to
  // the *next* frame on top of whatever frame the scroll event itself
  // landed on, adding a perceptible beat of lag during a swipe for no
  // correctness benefit, since `track.scrollLeft` is already current the
  // instant the event fires).
  const onScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track?.clientWidth) return;
    setActive(Math.round(Math.abs(track.scrollLeft) / track.clientWidth));
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

  useEffect(() => {
    if (active > count - 1) goTo(count - 1);
  }, [active, count, goTo]);

  return { trackRef, active, goTo, onScroll, onKeyDown };
}
