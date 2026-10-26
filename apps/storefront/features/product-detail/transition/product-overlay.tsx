"use client";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  animate,
  motion,
  useAnimation,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "motion/react";
// Imported from its own path, not the `@/components/layout` barrel — that
// barrel also re-exports DevDataBadge, which pulls in a server-only
// catalog module and breaks the client bundle for this client component.
import { Footer } from "@/components/layout/chrome/footer";
import type { PdpData } from "@/lib/catalog/resolve-pdp-data";
import { ProductDetail } from "../product-detail";
import { getProductSourceRect } from "./source-registry";
import { useProductTransitionStore } from "./product-transition-store";
import { fetchPdpOverlayData } from "./fetch-pdp-overlay-data";
import styles from "./product-overlay.module.css";

/**
 * An element the gesture must never try to interpret as the start of a
 * dismiss drag — any purchase control, link, gallery scroller, or other
 * interactive surface inside the overlaid PDP.
 */
const NO_DISMISS_SELECTOR =
  'button, a, input, textarea, select, [role="button"], [data-gallery-track], [data-no-dismiss]';

const DISMISS_DISTANCE = 140; // px — commit the close past this drag distance…
const DISMISS_VELOCITY = 700; // …or past this downward velocity (px/s), whichever comes first.
const DRAG_RANGE = 340; // px of travel the rubber-band/visual interpolation is defined over.
/** Upper bound on waiting for the real hero image to decode before revealing content anyway. */
const HERO_READY_TIMEOUT_MS = 2500;

type Rect = { left: number; top: number; width: number; height: number };

function lerpRect(from: Rect, to: Rect, progress: number): Rect {
  const t = Math.min(Math.max(progress, 0), 1);
  return {
    left: from.left + (to.left - from.left) * t,
    top: from.top + (to.top - from.top) * t,
    width: from.width + (to.width - from.width) * t,
    height: from.height + (to.height - from.height) * t,
  };
}

/**
 * The fullscreen expandable-card PDP overlay: mounted once (see
 * `app/[locale]/layout.tsx`), driven by `useProductTransitionStore`. The
 * *underlying route stays mounted* — this is a layer on top of it, not a
 * navigation — which is what keeps the originating page's scroll position
 * and content untouched while the overlay is open, and is why a direct PDP
 * URL load never sees this component engage at all (nothing ever calls
 * `open()` outside a card click).
 *
 * Two independent animated things, deliberately not conflated:
 *  - `imageControls` morphs the single `<motion.img>` between the measured
 *    source card rect and the fullscreen hero position (open), and back
 *    again (close). It is hidden once the real PDP content has rendered
 *    its own hero in the same place, and re-shown only for the close morph.
 *  - `y` (a motion value) is the card sheet's own drag offset, independent
 *    of the image — scale/radius/backdrop are derived from it via
 *    `useTransform`, driving the "shrinking into a card" feel while
 *    dragging, with no relation to the image's rect math.
 */
export function ProductOverlay() {
  const { phase, slug, href, sourceRect, imageSrc, returnScrollY, close } =
    useProductTransitionStore();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<PdpData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const [showMorphImage, setShowMorphImage] = useState(false);
  const [imageProgressed, setImageProgressed] = useState(false);
  const [heroReady, setHeroReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [canDismiss, setCanDismiss] = useState(true);
  // Content only ever appears once the open animation has finished AND the
  // real canonical hero image has actually decoded at its painted size (see
  // the heroReady effect below) AND the full canonical data has arrived —
  // never a reduced view that then gets replaced; that visible swap is
  // exactly the bug this endpoint/prop-set exists to prevent (see
  // resolvePdpData). A load failure is shown the same way, once the morph
  // has progressed, rather than leaving the sheet on its loading state
  // forever — heroReady is irrelevant in that case since there is no hero.
  const contentVisible =
    imageProgressed && (loadError || (data !== null && heroReady));
  const scrollRef = useRef<HTMLDivElement>(null);
  const heroTargetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  // Captured once at drag start so the floating image can track the finger
  // continuously instead of only appearing at drag-end (see onDragStart/onDrag).
  const dragRectsRef = useRef<{ hero: Rect; target: Rect } | null>(null);
  // True only while the OPEN handoff's clone is still waiting to hand off to
  // real content (see the contentVisible-driven fade-out effect below). Scoped
  // deliberately so that effect never re-fires during a later drag or close,
  // where `showMorphImage`/`contentVisible` can legitimately both be true
  // again for unrelated reasons.
  const openHandoffPendingRef = useRef(false);

  const y = useMotionValue(0);
  const imageControls = useAnimation();
  const backdropOpacity = useTransform(y, [0, DRAG_RANGE], [1, 0.25]);
  const cardScale = useTransform(y, [0, DRAG_RANGE], [1, 0.93]);
  const cardRadius = useTransform(y, [0, DRAG_RANGE], [0, 28]);

  useEffect(() => {
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, []);

  useEffect(() => {
    setMounted(phase === "open");
  }, [phase]);

  // `usePathname()` turns out to track the manual `pushState` in
  // use-open-product-transition.ts too (it isn't Next-router-exclusive in
  // this version), so `pathname` briefly lags behind `href` right after
  // opening and then catches up to equal it — that catch-up is NOT a
  // departure and must not close the overlay. Only once pathname has
  // actually arrived at `href` does any further mismatch mean a *real* way
  // out (Link/router.push to /cart, /checkout, any non-product route,
  // including one triggered from inside the overlaid PDP itself, e.g.
  // "رفتن به کیسه") — the one unambiguous signal the visible screen is no
  // longer this product. Tear down immediately and unconditionally then:
  // the destination route has already rendered underneath by the time
  // `pathname` changes, so there is nothing left to reverse-animate back
  // to, and leaving the overlay mounted here is exactly the "URL changed
  // but PDP stays visible" bug.
  const hasArrivedRef = useRef(false);
  // A related work opened from inside an already-open overlay calls open()
  // again with a new `href` without the phase ever leaving "open" (see
  // use-open-product-transition.ts) — this must restart the same
  // catch-up tracking as a fresh open, or the still-`true` `hasArrivedRef`
  // from the PREVIOUS product reads the next tick's stale pathname as a
  // real departure and closes the overlay before it ever arrives.
  const arrivedForHrefRef = useRef<string | null>(null);
  useEffect(() => {
    if (phase !== "open") {
      hasArrivedRef.current = false;
      arrivedForHrefRef.current = null;
      return;
    }
    if (arrivedForHrefRef.current !== href) {
      hasArrivedRef.current = false;
      arrivedForHrefRef.current = href;
    }
    if (!hasArrivedRef.current) {
      if (pathname === href) hasArrivedRef.current = true;
      return;
    }
    if (pathname !== href) close();
  }, [pathname, phase, href, close]);

  // Fetches the exact same data the direct route renders from (see
  // resolvePdpData / app/api/pdp/[slug]/route.ts) — not a reduced payload.
  // If the slug turns out to have moved (rare: a passport-only or renamed
  // work), there is no "lightweight PDP" to fall back to, so this hands
  // off to a real navigation rather than rendering something incomplete.
  useEffect(() => {
    if (!mounted || !slug) {
      setData(null);
      setLoadError(false);
      setHeroReady(false);
      return undefined;
    }
    setData(null);
    setLoadError(false);
    setHeroReady(false);
    const controller = new AbortController();
    fetchPdpOverlayData(slug, controller.signal).then((result) => {
      if (controller.signal.aborted) return;
      switch (result.kind) {
        case "data":
          setData(result.data);
          return;
        case "moved":
          window.location.href = result.href;
          return;
        case "not_found":
        case "error":
          setLoadError(true);
          return;
      }
    });
    // Cancels the in-flight attempt the moment the slug changes or the
    // overlay closes, so a slow response for a product the visitor already
    // navigated away from can never land and overwrite newer state.
    return () => controller.abort();
  }, [mounted, slug, retryToken]);

  // The real canonical hero <img data-pdp-hero> only exists in the DOM once
  // `data` has rendered `ProductDetail`. It is marked in product-gallery.tsx
  // specifically so this can find it without reimplementing which photo
  // variant/transform ends up as the rendered src. Resolves `heroReady` once
  // that exact element has actually decoded — never a guessed delay — with a
  // bounded fallback so a slow/broken image can't block the reveal forever.
  useEffect(() => {
    if (!data) return undefined;
    let settled = false;
    const markReady = () => {
      if (!settled) {
        settled = true;
        setHeroReady(true);
      }
    };
    const timer = window.setTimeout(markReady, HERO_READY_TIMEOUT_MS);
    const img = contentRef.current?.querySelector<HTMLImageElement>(
      "[data-pdp-hero] img",
    );
    if (!img) {
      // No photographed hero for this product (plate-only work) — nothing
      // to wait for.
      markReady();
    } else if (img.complete && img.naturalWidth > 0) {
      markReady();
    } else {
      img.addEventListener("load", markReady);
      img.addEventListener("error", markReady);
    }
    return () => {
      window.clearTimeout(timer);
      img?.removeEventListener("load", markReady);
      img?.removeEventListener("error", markReady);
    };
  }, [data]);

  // Lock the underlying page's scroll while the overlay is open, and
  // restore it — unchanged — the moment the overlay unmounts.
  useEffect(() => {
    if (!mounted) return undefined;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousTouchAction = body.style.touchAction;
    body.style.overflow = "hidden";
    body.style.touchAction = "none";
    return () => {
      body.style.overflow = previousOverflow;
      body.style.touchAction = previousTouchAction;
      window.scrollTo(0, returnScrollY);
    };
  }, [mounted, returnScrollY]);

  // Open animation: interpolate from the measured source rect to the
  // fullscreen hero position (measured once the overlay's own hero
  // placeholder has laid out). PDP content fades in once it progresses.
  useLayoutEffect(() => {
    if (!mounted || !sourceRect) return;
    y.set(0);
    dragRectsRef.current = null;
    openHandoffPendingRef.current = true;
    setImageProgressed(false);
    setShowMorphImage(true);
    const target = heroTargetRef.current?.getBoundingClientRect();
    imageControls.set({
      x: sourceRect.x,
      y: sourceRect.y,
      width: sourceRect.width,
      height: sourceRect.height,
      borderRadius: sourceRect.borderRadius,
      opacity: 1,
    });
    if (!target || reducedMotion) {
      setImageProgressed(true);
      return;
    }
    // `imageProgressed` flips once the morph genuinely finishes animating —
    // never a guessed duration. The clone itself is NOT hidden here: it
    // stays frozen in place (see the contentVisible-driven fade-out effect
    // below) until the real hero has also decoded, so there is never a
    // visible blank/placeholder gap between "clone gone" and "real hero
    // ready" even if the real image is still loading at this point.
    void imageControls
      .start({
        x: target.left,
        y: target.top,
        width: target.width,
        height: target.height,
        borderRadius: 0,
        transition: { duration: 0.46, ease: [0.16, 1, 0.3, 1] },
      })
      .then(() => setImageProgressed(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only re-runs when a new card is opened
  }, [mounted, sourceRect]);

  // Cross-fades the floating clone out only once the real content is truly
  // ready to be seen (see `contentVisible`) — this is the actual handoff,
  // not the animation's own completion, which is what previously let a
  // blank hero show through for however long the data/image fetch lagged
  // behind the 460ms morph.
  useEffect(() => {
    if (!openHandoffPendingRef.current || !contentVisible || !showMorphImage) {
      return undefined;
    }
    openHandoffPendingRef.current = false;
    let cancelled = false;
    void imageControls
      .start({ opacity: 0, transition: { duration: 0.18 } })
      .then(() => {
        if (!cancelled) setShowMorphImage(false);
      });
    return () => {
      cancelled = true;
    };
  }, [contentVisible, showMorphImage, imageControls]);

  const performClose = useCallback(
    (viaGesture: boolean) => {
      const targetRect = slug ? getProductSourceRect(slug) : null;
      const finish = () => {
        close();
        if (window.history.state?.radOverlay) window.history.back();
      };
      if (!targetRect || reducedMotion) {
        finish();
        return;
      }
      setImageProgressed(false);
      const duration = viaGesture ? 0.32 : 0.38;
      const ease = [0.16, 1, 0.3, 1] as const;
      // Let the card sheet's own shrink (scale/radius, derived from `y`)
      // ease back to rest over the same duration as the image morph instead
      // of snapping to 0 instantly, so the two never visibly disagree.
      void animate(y, 0, { duration, ease });
      // A drag already in flight has been continuously positioning the
      // clone via onDrag below — reuse that live position as the morph's
      // start instead of resetting to the fullscreen hero rect, which is
      // what produced the "pop" at drag-end. Only a non-gesture close
      // (button/back, no drag happened) needs the fullscreen reset.
      if (!viaGesture || !dragRectsRef.current) {
        scrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
        const heroRect = heroTargetRef.current?.getBoundingClientRect();
        if (heroRect) {
          imageControls.set({
            x: heroRect.left,
            y: heroRect.top,
            width: heroRect.width,
            height: heroRect.height,
            borderRadius: 0,
            opacity: 1,
          });
        }
      }
      dragRectsRef.current = null;
      setShowMorphImage(true);
      void imageControls
        .start({
          x: targetRect.left,
          y: targetRect.top,
          width: targetRect.width,
          height: targetRect.height,
          borderRadius: 14,
          opacity: 1,
          transition: { duration, ease },
        })
        .then(finish);
    },
    [close, imageControls, reducedMotion, slug, y],
  );

  // Browser back closes the overlay with the reverse transition instead of
  // leaving a dangling history entry pointed at a URL with no page behind it.
  useEffect(() => {
    if (!mounted) return undefined;
    const onPopState = () => performClose(false);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [mounted, performClose]);

  // Drag-to-dismiss must move the hero continuously with the finger, not
  // just the card sheet (which already shrinks via cardScale/cardRadius).
  // onDragStart captures the two endpoints once; onDrag re-positions the
  // floating clone every frame by interpolating between them off the live
  // drag offset — the same rect math the open/close morph uses, just driven
  // by gesture progress instead of a timed animation.
  const onDragStart = useCallback(() => {
    if (!canDismiss || !slug || reducedMotion) return;
    const heroRect = heroTargetRef.current?.getBoundingClientRect();
    const targetRect = getProductSourceRect(slug);
    if (!heroRect || !targetRect) return;
    dragRectsRef.current = { hero: heroRect, target: targetRect };
    imageControls.set({
      x: heroRect.left,
      y: heroRect.top,
      width: heroRect.width,
      height: heroRect.height,
      borderRadius: 0,
      opacity: 1,
    });
    setShowMorphImage(true);
  }, [canDismiss, imageControls, reducedMotion, slug]);

  const onDrag = useCallback(
    (_event: PointerEvent, info: PanInfo) => {
      const rects = dragRectsRef.current;
      if (!rects) return;
      const progress = info.offset.y / DRAG_RANGE;
      const rect = lerpRect(rects.hero, rects.target, progress);
      imageControls.set({
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        borderRadius: 14 * Math.min(Math.max(progress, 0), 1),
        opacity: 1,
      });
    },
    [imageControls],
  );

  const onDragEnd = useCallback(
    (_event: PointerEvent, info: PanInfo) => {
      const distance = info.offset.y;
      const velocity = info.velocity.y;
      if (distance > DISMISS_DISTANCE || velocity > DISMISS_VELOCITY) {
        performClose(true);
        return;
      }
      void animate(y, 0, { type: "spring", stiffness: 420, damping: 38 });
      // Cancelled drag: ease the clone back to the fullscreen hero rect in
      // step with the card spring, then hand back to the real content.
      const rects = dragRectsRef.current;
      if (rects) {
        void imageControls
          .start({
            x: rects.hero.left,
            y: rects.hero.top,
            width: rects.hero.width,
            height: rects.hero.height,
            borderRadius: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 420, damping: 38 },
          })
          .then(() => {
            dragRectsRef.current = null;
            if (contentVisible) setShowMorphImage(false);
          });
      }
    },
    [contentVisible, imageControls, performClose, y],
  );

  // A dismiss drag may only begin from non-interactive PDP surface, and
  // only once the PDP's own scroll has returned to the top — otherwise the
  // same gesture scrolls content, exactly as section G of the spec requires.
  const onPointerDownCapture = useCallback((event: ReactPointerEvent) => {
    const target = event.target as HTMLElement;
    if (target.closest(NO_DISMISS_SELECTOR)) {
      setCanDismiss(false);
      return;
    }
    const scrollTop = scrollRef.current?.scrollTop ?? 0;
    setCanDismiss(scrollTop <= 0);
  }, []);

  if (!mounted || !slug || !href || !sourceRect) return null;

  return (
    <div className={styles.root} role="dialog" aria-modal="true">
      <motion.div
        className={styles.backdrop}
        style={{ opacity: reducedMotion ? undefined : backdropOpacity }}
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reducedMotion ? 0.12 : 0.3 }}
        onClick={() => performClose(false)}
      />
      <motion.div
        className={styles.card}
        drag={canDismiss ? "y" : false}
        dragDirectionLock
        dragConstraints={{ top: 0, bottom: DRAG_RANGE }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        style={{
          y,
          scale: reducedMotion ? 1 : cardScale,
          borderRadius: reducedMotion ? 0 : cardRadius,
        }}
        onPointerDownCapture={onPointerDownCapture}
        onDragStart={onDragStart}
        onDrag={onDrag}
        onDragEnd={onDragEnd}
      >
        <div className={styles.scroll} ref={scrollRef}>
          <div className={styles.heroTarget} ref={heroTargetRef} />
          <button
            type="button"
            className={styles.close}
            aria-label="بستن"
            data-no-dismiss
            onClick={() => performClose(false)}
          >
            <X aria-hidden="true" />
          </button>
          <div
            ref={contentRef}
            className={styles.content}
            style={{ opacity: contentVisible ? 1 : 0 }}
          >
            {data ? (
              <>
                <ProductDetail
                  product={data.product}
                  artwork={data.artwork}
                  passport={data.passport}
                  related={data.related}
                  initialFaq={data.faq}
                  qrSvg={data.qrSvg}
                />
                <Footer />
              </>
            ) : loadError ? (
              <div className={styles.errorState} role="alert">
                <p>بار گذاری اطلاعات محصول ناموفق بود.</p>
                <button
                  type="button"
                  className={styles.errorRetry}
                  onClick={() => setRetryToken((n) => n + 1)}
                >
                  تلاش دوباره
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </motion.div>
      {showMorphImage && imageSrc ? (
        <motion.img
          src={imageSrc}
          alt=""
          className={styles.morphImage}
          animate={imageControls}
        />
      ) : null}
    </div>
  );
}
