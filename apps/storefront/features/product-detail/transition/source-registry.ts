/**
 * Maps a product slug to its currently-mounted card image element, so the
 * close animation can re-measure the *current* rect (the list may have
 * scrolled while the overlay was open) rather than the stale rect captured
 * at open time. A plain module-level map, not React state — this is a DOM
 * reference registry, not something that should trigger re-renders.
 */
const registry = new Map<string, HTMLElement>();

export function registerProductSource(slug: string, el: HTMLElement | null) {
  if (el) registry.set(slug, el);
  else registry.delete(slug);
}

export function getProductSourceRect(slug: string): DOMRect | null {
  const el = registry.get(slug);
  if (!el || !el.isConnected) return null;
  return el.getBoundingClientRect();
}

export function getProductSourceImageSrc(slug: string): string | null {
  const el = registry.get(slug);
  if (!el) return null;
  const img =
    el.tagName === "IMG" ? (el as HTMLImageElement) : el.querySelector("img");
  return img?.currentSrc || img?.src || null;
}
