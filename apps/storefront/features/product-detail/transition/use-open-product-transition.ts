"use client";
import { useCallback, useRef, type MouseEvent } from "react";
import { registerProductSource } from "./source-registry";
import { useProductTransitionStore } from "./product-transition-store";

/**
 * The one place that knows how to turn a card click into an open overlay
 * call — every product-card variant (ProductCardStage, CatalogCard, and
 * any future one) uses this instead of re-implementing rect measurement
 * and the open() call per page. Spread the returned `ref`/`onClick` onto
 * the card's `<Link>` (the element wrapping the actual `<img>`).
 */
export function useOpenProductTransition(slug: string, href: string) {
  const artRef = useRef<HTMLElement | null>(null);
  const open = useProductTransitionStore((state) => state.open);

  const onClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }
      // Guards against stacking a second `radOverlay` history entry if the
      // visitor manages to tap another card (e.g. a related work) while the
      // overlay is still open — one history entry per overlay session keeps
      // a single browser-back press landing back on the real origin page.
      if (window.history.state?.radOverlay) return;
      const img = artRef.current?.querySelector("img");
      if (!img) return;
      const rect = img.getBoundingClientRect();
      const radius = parseFloat(getComputedStyle(img).borderRadius) || 0;
      const imageSrc = img.currentSrc || img.src;
      if (!imageSrc) return;
      event.preventDefault();
      open({
        slug,
        href,
        rect: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          borderRadius: radius,
        },
        imageSrc,
      });
      window.history.pushState({ radOverlay: true }, "", href);
    },
    [href, open, slug],
  );

  const ref = useCallback(
    (node: HTMLAnchorElement | null) => {
      artRef.current = node;
      registerProductSource(slug, node?.querySelector("img") ?? null);
    },
    [slug],
  );

  return { ref, onClick };
}
