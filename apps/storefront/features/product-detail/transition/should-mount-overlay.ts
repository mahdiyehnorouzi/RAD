/**
 * Whether `ProductOverlayGate` should mount the real `ProductOverlay` (and
 * pull in its `motion`/`ProductDetail` chunk): as soon as a card has
 * actually been opened — never delayed by the idle fallback — or once the
 * browser has gone idle after initial load, so the overlay is warm for a
 * later click. Kept dependency-free so the "a click is never blocked by
 * the idle gate" invariant is testable without a DOM or Next's runtime.
 */
export function shouldMountOverlay(opened: boolean, idleReady: boolean) {
  return opened || idleReady;
}
