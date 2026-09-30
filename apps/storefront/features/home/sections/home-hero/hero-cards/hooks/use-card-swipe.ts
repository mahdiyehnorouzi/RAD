"use client";

import { useRef, type MouseEvent, type PointerEvent } from "react";
import { HERO_CARD_SWIPE_PX } from "@/features/home/const";

/** A horizontal drag past the threshold counts as a swipe and swallows the click that follows. */
export function useCardSwipe(
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
) {
  const origin = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

  function settle(clientX: number, clientY: number) {
    if (!origin.current || swiped.current) return;
    const dx = clientX - origin.current.x;
    const dy = clientY - origin.current.y;
    if (Math.abs(dx) < HERO_CARD_SWIPE_PX || Math.abs(dx) <= Math.abs(dy))
      return;
    swiped.current = true;
    origin.current = null;
    if (dx < 0) onSwipeLeft();
    else onSwipeRight();
  }

  return {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      origin.current = { x: event.clientX, y: event.clientY };
      swiped.current = false;
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      settle(event.clientX, event.clientY);
    },
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      settle(event.clientX, event.clientY);
      origin.current = null;
    },
    onPointerCancel: () => {
      origin.current = null;
    },
    onClickCapture: (event: MouseEvent<HTMLElement>) => {
      if (!swiped.current) return;
      swiped.current = false;
      event.preventDefault();
      event.stopPropagation();
    },
  };
}
