"use client";
import { useCallback, useRef, type MouseEvent } from "react";
import { nextOverlayStack } from "./overlay-history";
import { readOverlayStack, writeOverlayStack } from "./overlay-stack-storage";
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
  // Whether a related-work click is "chained" (appends to the sessionStorage
  // stack) is read from this in-memory store, not `window.history.state` -
  // Next's own router manages that state too and has been observed to
  // overwrite custom fields on it between renders, which previously made a
  // click shortly after the first open mistakenly look like a fresh one.
  const alreadyOpen = useProductTransitionStore(
    (state) => state.phase === "open",
  );

  const onClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }
      // A second card tapped while the overlay is already open (e.g. a
      // related work inside it) still opens through the overlay, and now
      // appends to a stack of opened products (kept in sessionStorage, see
      // overlay-stack-storage.ts) instead of replacing the history entry
      // underneath it — replacing used to silently delete the intermediate
      // product from history, so Back from it skipped straight past it to
      // whatever was open before the overlay started. The stack lives in
      // sessionStorage rather than `window.history.state` because Next's
      // own router also manages that state for its own purposes and can
      // overwrite custom fields on it.
      const stack = nextOverlayStack(
        readOverlayStack(),
        { slug, href },
        alreadyOpen,
      );
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
      writeOverlayStack(stack);
      window.history.pushState({ radOverlay: true }, "", href);
    },
    [alreadyOpen, href, open, slug],
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
