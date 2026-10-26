/**
 * Whether a gallery slide is the one genuine LCP candidate on a PDP: the
 * main stage's first slide. Only this slide should ever get
 * `fetchPriority="high"` (see `ProductMedia`'s `fetchPriority` prop) —
 * everywhere else (thumbs, secondary tiles, any other slide) stays at the
 * browser's default priority. Kept as a standalone, dependency-free
 * predicate so it's testable without a DOM.
 */
export function isHeroSlide(
  context: "stage" | "thumb",
  isFirstSlide: boolean,
) {
  return context === "stage" && isFirstSlide;
}
