"use client";

import { useEffect, useRef } from "react";

/** Spring pull back to rest, per second squared, and its damping, per second. */
const STIFFNESS = 38;
const DAMPING = 3.2;
/** Degrees per second of swing added for each pixel scrolled. */
const KICK = 0.2;
const MAX_SWING = 12;

/**
 * Rocks an element on its transform origin as the page scrolls: scrolling
 * pushes a damped spring, so it sways while the page moves and settles after.
 * The angle is written to `--swing` in degrees.
 */
export function useScrollSwing<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (
      !element ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return undefined;
    }

    let angle = 0;
    let speed = 0;
    let lastY = window.scrollY;
    let lastTime = 0;
    let frame = 0;
    let visible = false;

    const step = (time: number) => {
      const dt = lastTime ? Math.min(0.05, (time - lastTime) / 1000) : 1 / 60;
      lastTime = time;
      const y = window.scrollY;
      speed += (y - lastY) * KICK;
      lastY = y;
      speed += (-STIFFNESS * angle - DAMPING * speed) * dt;
      angle = Math.max(-MAX_SWING, Math.min(MAX_SWING, angle + speed * dt));

      if (Math.abs(angle) < 0.02 && Math.abs(speed) < 0.05) {
        angle = 0;
        speed = 0;
        frame = 0;
        lastTime = 0;
        element.style.setProperty("--swing", "0deg");
        return;
      }
      element.style.setProperty("--swing", `${angle.toFixed(2)}deg`);
      frame = window.requestAnimationFrame(step);
    };

    const wake = () => {
      if (!visible) {
        lastY = window.scrollY;
        return;
      }
      if (!frame) frame = window.requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1].isIntersecting;
      lastY = window.scrollY;
    });
    observer.observe(element);
    window.addEventListener("scroll", wake, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", wake);
    };
  }, []);

  return ref;
}
