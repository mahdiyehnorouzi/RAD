import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { pickVisibleSlide } from "./pick-visible-slide";

/**
 * One scroll-snapped track drives the gallery, so touch swipe, arrows,
 * thumbnails and the keyboard all agree on the active slide. RTL tracks report
 * a negative `scrollLeft`, hence the direction sign.
 */
export function useGalleryTrack(count: number) {
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);
  const [active, setActive] = useState(0);

  const registerSlide = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      slideRefs.current[index] = el;
    },
    [],
  );

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
      // fired their own scroll-driven re-render, which is what the
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

  // A touch swipe's own momentum/deceleration phase is driven entirely by
  // the OS compositor, not JS - and on iOS Safari specifically, the track's
  // `scroll` event is throttled heavily (sometimes to a single event) during
  // that phase, so a swipe used to visibly finish - the image already
  // settled on the next slide - well before a scroll-event-driven counter
  // caught up, if it fired again at all before the gesture ended. An
  // IntersectionObserver watching each slide isn't tied to the `scroll`
  // event's firing cadence at all: the browser reports visibility changes
  // as they actually happen, so this reflects the settled slide reliably
  // regardless of how many (or how few) `scroll` events the swipe produced.
  // Button/thumbnail/keyboard navigation doesn't depend on this at all -
  // `goTo` already sets `active` synchronously and instantly for those.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const next = pickVisibleSlide(
          entries.map((entry) => ({
            index: Number((entry.target as HTMLElement).dataset.slideIndex),
            isIntersecting: entry.isIntersecting,
            intersectionRatio: entry.intersectionRatio,
          })),
        );
        if (next !== null) setActive(next);
      },
      { root: track, threshold: [0.5, 0.75, 1] },
    );
    slideRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [count]);

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

  return { trackRef, active, goTo, registerSlide, onKeyDown };
}
