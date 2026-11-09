/**
 * Whether an IntersectionObserver-reported slide should actually update
 * `active`, given `pendingTarget` - the slide a `goTo()` button tap most
 * recently requested, while its `scrollTo` may still be animating there.
 * The animated scroll passes through every slide in between, and the
 * observer reports each one along the way; only the exact requested target
 * should ever win while one is pending, or an intermediate slide briefly
 * overwrites the target the user actually tapped. Returns the report
 * itself when it should apply, or null to ignore it.
 */
export function resolveVisibleSlide(
  reported: number,
  pendingTarget: number | null,
): number | null {
  if (pendingTarget === null) return reported;
  return reported === pendingTarget ? reported : null;
}
