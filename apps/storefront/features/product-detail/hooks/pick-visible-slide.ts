export type VisibleSlideEntry = {
  index: number;
  isIntersecting: boolean;
  intersectionRatio: number;
};

/**
 * Which slide an IntersectionObserver batch says is "the" visible one: the
 * most-visible intersecting entry, or null if nothing crossed the
 * observer's threshold this batch (the caller should then just keep
 * whatever was active before — there is always exactly one fully-visible
 * slide at rest in a snapped track, so a null batch only ever happens
 * mid-scroll, between two slides, never as a final state).
 */
export function pickVisibleSlide(entries: VisibleSlideEntry[]): number | null {
  let best: { index: number; ratio: number } | null = null;
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    if (!best || entry.intersectionRatio > best.ratio) {
      best = { index: entry.index, ratio: entry.intersectionRatio };
    }
  }
  return best?.index ?? null;
}
