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
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<PdpData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const [showMorphImage, setShowMorphImage] = useState(false);
  const [imageProgressed, setImageProgressed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [canDismiss, setCanDismiss] = useState(true);
  // Content only ever appears once BOTH the open animation has progressed
  // far enough AND the full canonical data has arrived — never a reduced
  // view that then gets replaced; that visible swap is exactly the bug
  // this endpoint/prop-set exists to prevent (see resolvePdpData). A load
  // failure is shown the same way, once the morph has progressed, rather
  // than leaving the sheet on its loading state forever.
  const contentVisible = imageProgressed && (data !== null || loadError);
  const scrollRef = useRef<HTMLDivElement>(null);
  const heroTargetRef = useRef<HTMLDivElement>(null);

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

  // Fetches the exact same data the direct route renders from (see
  // resolvePdpData / app/api/pdp/[slug]/route.ts) — not a reduced payload.
  // If the slug turns out to have moved (rare: a passport-only or renamed
  // work), there is no "lightweight PDP" to fall back to, so this hands
  // off to a real navigation rather than rendering something incomplete.
  useEffect(() => {
    if (!mounted || !slug) {
      setData(null);
      setLoadError(false);
      return undefined;
    }
    setData(null);
    setLoadError(false);
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
    setImageProgressed(false);
    setShowMorphImage(true);
    const target = heroTargetRef.current?.getBoundingClientRect();
    imageControls.set({
      x: sourceRect.x,
      y: sourceRect.y,
      width: sourceRect.width,
      height: sourceRect.height,
      borderRadius: sourceRect.borderRadius,
    });
    if (!target || reducedMotion) {
      setShowMorphImage(false);
      setImageProgressed(true);
      return;
    }
    void imageControls
      .start({
        x: target.left,
        y: target.top,
        width: target.width,
        height: target.height,
        borderRadius: 0,
        transition: { duration: 0.46, ease: [0.16, 1, 0.3, 1] },
      })
      .then(() => {
        setShowMorphImage(false);
      });
    const contentTimer = window.setTimeout(() => setImageProgressed(true), 220);
    return () => window.clearTimeout(contentTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only re-runs when a new card is opened
  }, [mounted, sourceRect]);

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
      // Snap the scroller to top so the re-shown morph image lines up with
      // the hero's rect at rest, not wherever the visitor had scrolled to.
      scrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
      const heroRect = heroTargetRef.current?.getBoundingClientRect();
      if (heroRect) {
        imageControls.set({
          x: heroRect.left,
          y: heroRect.top,
          width: heroRect.width,
          height: heroRect.height,
          borderRadius: 0,
        });
      }
      setShowMorphImage(true);
      void animate(y, 0, { type: "tween", duration: 0 });
      void imageControls
        .start({
          x: targetRect.left,
          y: targetRect.top,
          width: targetRect.width,
          height: targetRect.height,
          borderRadius: 14,
          transition: { duration: viaGesture ? 0.32 : 0.38, ease: [0.16, 1, 0.3, 1] },
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

  const onDragEnd = useCallback(
    (_event: PointerEvent, info: PanInfo) => {
      const distance = info.offset.y;
      const velocity = info.velocity.y;
      if (distance > DISMISS_DISTANCE || velocity > DISMISS_VELOCITY) {
        performClose(true);
      } else {
        void animate(y, 0, { type: "spring", stiffness: 420, damping: 38 });
      }
    },
    [performClose, y],
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
