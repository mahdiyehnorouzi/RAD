import { useEffect } from "react";

export function openHeaderOverlay(id: string) {
  window.dispatchEvent(new CustomEvent("rad:header-overlay", { detail: id }));
}

export function useHeaderOverlay(id: string, onForeignOpen: () => void) {
  useEffect(() => {
    const close = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== id) onForeignOpen();
    };
    window.addEventListener("rad:header-overlay", close);
    return () => window.removeEventListener("rad:header-overlay", close);
  }, [id, onForeignOpen]);
}

export function useEscape(onEscape: () => void) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onEscape();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onEscape]);
}
