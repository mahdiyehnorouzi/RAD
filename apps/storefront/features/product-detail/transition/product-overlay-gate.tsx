"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useProductTransitionStore } from "./product-transition-store";
import { shouldMountOverlay } from "./should-mount-overlay";

const ProductOverlay = dynamic(() =>
  import("./product-overlay").then((mod) => mod.ProductOverlay),
);

/**
 * Mounted once, globally, in place of `<ProductOverlay>` directly. The real
 * overlay (and the `motion` library + full `ProductDetail` tree it drags
 * in — ~50KB+ transferred) used to load on every single page view via
 * `next/dynamic`, because `dynamic()` fetches its chunk as soon as the
 * component is rendered, and `<ProductOverlay>` was unconditionally in the
 * root layout. Visitors who never open a card (most page views: home, PLP,
 * about, etc.) paid that cost for nothing.
 *
 * This gate only mounts the real overlay once there's an actual reason to:
 * the transition store (a plain Zustand store — see product-transition-store.ts,
 * safe to subscribe to without pulling in the overlay itself) reports a card
 * was opened, OR the browser has gone idle after the initial page load. The
 * idle fallback means the chunk is still warm well before a visitor
 * realistically reads a card and clicks it — this does not make the first
 * click feel different, it only moves the fetch off the critical path for
 * the (common) pages where it's never used at all.
 */
export function ProductOverlayGate() {
  // A card click sets `phase` to "open" synchronously (see
  // product-transition-store.ts), well before this component would ever
  // re-render from the idle timer below — reading it directly in render
  // (rather than mirroring it into state via an effect) avoids an extra
  // render pass on the one path that's actually latency-sensitive.
  const opened = useProductTransitionStore((state) => state.phase === "open");
  const [idleReady, setIdleReady] = useState(false);

  useEffect(() => {
    if (opened || idleReady) return undefined;
    const idle =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback
        : (cb: IdleRequestCallback) =>
            window.setTimeout(() => cb({} as IdleDeadline), 1);
    const cancelIdle =
      typeof window.cancelIdleCallback === "function"
        ? window.cancelIdleCallback
        : window.clearTimeout;
    const handle = idle(() => setIdleReady(true), { timeout: 2000 });
    return () => cancelIdle(handle);
  }, [opened, idleReady]);

  if (!shouldMountOverlay(opened, idleReady)) return null;
  return <ProductOverlay />;
}
