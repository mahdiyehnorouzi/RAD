import { useEffect, useRef } from "react";

/**
 * The element the page actually scrolls: `.admin-main` has no height/
 * overflow of its own (confirmed by reading globals.css — plain padding,
 * no `overflow`), so the admin shell's document is the real scroll
 * container. `document.scrollingElement` resolves that directly, instead
 * of assuming it's `<html>`/`<body>` or hardcoding `window`; the
 * `window.scrollY` fallback only matters for an environment where
 * `scrollingElement` itself is unavailable.
 */
function readScrollTop(): number {
  return document.scrollingElement?.scrollTop ?? window.scrollY;
}

function writeScrollTop(top: number): void {
  const el = document.scrollingElement;
  if (el) el.scrollTop = top;
  else window.scrollTo(0, top);
}

/**
 * Scroll-to-top-on-open / restore-on-close for a list↔detail pane that
 * swaps in place (no route change) on narrow viewports — Custom Orders
 * and regular Orders both use this on mobile.
 *
 * Gated entirely on `activeId`'s *identity*, not on when the surrounding
 * component re-renders: a background poll that refreshes the underlying
 * list/record while the same item stays selected does not change
 * `activeId`, so it can never re-trigger a scroll — the effect's own
 * `activeId !== previous` check (not a render-count or timer) is what
 * makes that safe. `activeId` becoming null is treated as "closed"
 * regardless of *why* — the in-app close button and a browser Back that
 * lands on a hash-less URL (via the existing popstate listener, which
 * already drives the same `selectedId`/`requestedId` state) both just
 * change this value the same way, so both are exercised by the exact
 * same path and tests against one cover the other.
 *
 * A pending `requestAnimationFrame` from a previous open/close is always
 * canceled before scheduling or performing the next scroll action, so a
 * rapid close→reopen→close can't let a stale callback fire after a newer
 * one and overwrite its result with an outdated target.
 */
export function useDetailScrollRestore(activeId: string | null) {
  const previousId = useRef<string | null>(null);
  const savedScrollTop = useRef(0);
  const pendingFrame = useRef<number | null>(null);

  const cancelPendingFrame = () => {
    if (pendingFrame.current !== null) {
      window.cancelAnimationFrame(pendingFrame.current);
      pendingFrame.current = null;
    }
  };

  useEffect(() => {
    const previous = previousId.current;
    if (activeId && activeId !== previous) {
      cancelPendingFrame();
      writeScrollTop(0);
    } else if (!activeId && previous) {
      const target = savedScrollTop.current;
      cancelPendingFrame();
      pendingFrame.current = window.requestAnimationFrame(() => {
        pendingFrame.current = null;
        writeScrollTop(target);
      });
    }
    previousId.current = activeId;
  }, [activeId]);

  // Unmounting mid-transition (navigating away to a different studio
  // section entirely, not just closing the detail pane) must not leave a
  // scheduled restore to fire later against whatever the next screen has
  // scrolled to.
  useEffect(() => cancelPendingFrame, []);

  return {
    /** Call right before opening a detail, while the list is still on
     * screen, so its current scroll offset is what gets restored on close. */
    saveScroll: () => {
      savedScrollTop.current = readScrollTop();
    },
  };
}
