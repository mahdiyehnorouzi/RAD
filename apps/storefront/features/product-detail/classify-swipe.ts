/**
 * Classifies a completed single-finger drag on the fullscreen lightbox stage
 * as a slide-change swipe, or not. A swipe must be mostly horizontal and
 * past the distance threshold — short drags and vertical gestures (taps,
 * scroll attempts) never count, so this also gates whether an incidental
 * press-and-release on a nav button or thumbnail could be mistaken for one.
 * Direction follows the drag's physical motion, mirrored for RTL: dragging
 * toward the start of reading order (left in LTR, right in RTL) advances to
 * the next slide, matching a native photo-swipe carousel rather than the
 * arrow-key convention (where ArrowLeft always means "previous" in LTR).
 */
export function classifySwipe(
  dx: number,
  dy: number,
  rtl: boolean,
  threshold = 40,
): "next" | "previous" | null {
  if (Math.abs(dx) < threshold || Math.abs(dx) <= Math.abs(dy)) return null;
  const draggedTowardReadingStart = rtl ? dx > 0 : dx < 0;
  return draggedTowardReadingStart ? "next" : "previous";
}
