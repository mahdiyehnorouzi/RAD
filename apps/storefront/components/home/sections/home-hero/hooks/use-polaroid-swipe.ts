"use client";

import { useRef, type PointerEvent } from "react";
import { POLAROID_SWIPE_PX } from "@/components/home/const";

export function usePolaroidSwipe(onNext: () => void, onPrev: () => void) {
  const origin = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

  function settle(clientX: number, clientY: number) {
    if (!origin.current || swiped.current) return;
    const dx = clientX - origin.current.x;
    const dy = clientY - origin.current.y;
    if (Math.abs(dx) < POLAROID_SWIPE_PX || Math.abs(dx) <= Math.abs(dy)) return;
    swiped.current = true;
    origin.current = null;
    if (dx < 0) onNext();
    else onPrev();
  }

  return {
    didSwipe: () => swiped.current,
    clearSwipe: () => {
      swiped.current = false;
      origin.current = null;
    },
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      origin.current = { x: event.clientX, y: event.clientY };
      swiped.current = false;
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      settle(event.clientX, event.clientY);
    },
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      settle(event.clientX, event.clientY);
      origin.current = null;
    },
  };
}
