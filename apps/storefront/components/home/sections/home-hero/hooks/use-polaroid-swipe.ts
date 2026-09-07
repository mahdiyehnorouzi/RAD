"use client";

import { useRef, type PointerEvent } from "react";
import { POLAROID_SWIPE_PX } from "@/components/home/const";

export function usePolaroidSwipe(onNext: () => void, onPrev: () => void) {
  const origin = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

  return {
    didSwipe: () => swiped.current,
    clearSwipe: () => {
      swiped.current = false;
    },
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      origin.current = { x: event.clientX, y: event.clientY };
      swiped.current = false;
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      if (!origin.current) return;
      const dx = event.clientX - origin.current.x;
      const dy = event.clientY - origin.current.y;
      origin.current = null;
      if (Math.abs(dx) < POLAROID_SWIPE_PX || Math.abs(dx) <= Math.abs(dy)) return;
      swiped.current = true;
      if (dx < 0) onNext();
      else onPrev();
    },
  };
}
