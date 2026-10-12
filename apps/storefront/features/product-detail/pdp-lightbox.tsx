"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ChevronLeft, ChevronRight, Share2, X } from "lucide-react";
import type { Product } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { ProductMedia } from "@/components/product/listing";
import { pdpCopy } from "./const";
import styles from "./pdp-lightbox.module.css";

type Slide = { kind: "photo"; index: number } | { kind: "plate" };

const MIN_SCALE = 1;
const MAX_SCALE = 3;

/**
 * Fullscreen photo viewer: counter + close + prev/next chevrons + a bottom
 * thumbnail strip, all driven by the same active index as the gallery
 * track (`useGalleryTrack`) so opening/closing never maintains a second,
 * divergent index. Touch pinch-to-zoom and pan are implemented directly
 * with pointer events (no gesture library exists in this repo).
 */
export function PdpLightbox({
  product,
  slides,
  active,
  count,
  onGoTo,
  onClose,
  renderSlide,
}: {
  product: Product;
  slides: Slide[];
  active: number;
  count: number;
  onGoTo: (index: number) => void;
  onClose: () => void;
  renderSlide: (slide: Slide) => React.ReactNode;
}) {
  const { locale, number } = useLocale();
  const c = pdpCopy[locale];
  const format = (value: number) =>
    locale === "fa" ? number(value) : String(value);
  const dialogRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const PreviousIcon = locale === "fa" ? ChevronRight : ChevronLeft;
  const NextIcon = locale === "fa" ? ChevronLeft : ChevronRight;
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const [copied, setCopied] = useState(false);
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const pinch = useRef<{
    startDistance: number;
    startScale: number;
    pointers: Map<number, { x: number; y: number }>;
  } | null>(null);
  const pan = useRef<{ x: number; y: number } | null>(null);

  const resetZoom = useCallback(() => setTransform({ scale: 1, x: 0, y: 0 }), []);

  useEffect(() => {
    resetZoom();
  }, [active, resetZoom]);

  // Focus trap + body scroll lock + return focus to the trigger on close.
  useEffect(() => {
    const trigger = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      if (trigger instanceof HTMLElement) trigger.focus();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        const rtl = locale === "fa";
        const forward = (event.key === "ArrowLeft") === rtl;
        onGoTo(active + (forward ? 1 : -1));
        return;
      }
      if (event.key === "Tab") {
        const node = dialogRef.current;
        if (!node) return;
        const focusables = node.querySelectorAll<HTMLElement>(
          "button, [href], [tabindex]:not([tabindex='-1'])",
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, locale, onClose, onGoTo]);

  const onShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareData = { title: product.slug, url };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // user cancelled or unsupported — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // nothing more we can do without a clipboard permission
    }
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const node = pinch.current ?? {
      startDistance: 0,
      startScale: transform.scale,
      pointers: new Map<number, { x: number; y: number }>(),
    };
    node.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (node.pointers.size === 2) {
      const [a, b] = [...node.pointers.values()];
      node.startDistance = Math.hypot(a.x - b.x, a.y - b.y);
      node.startScale = transform.scale;
    } else if (node.pointers.size === 1 && transform.scale > 1) {
      pan.current = { x: event.clientX - transform.x, y: event.clientY - transform.y };
    }
    pinch.current = node;
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const node = pinch.current;
    if (!node?.pointers.has(event.pointerId)) return;
    node.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (node.pointers.size === 2) {
      const [a, b] = [...node.pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const next = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, node.startScale * (dist / (node.startDistance || dist))),
      );
      setTransform((prev) => ({ ...prev, scale: next }));
    } else if (node.pointers.size === 1 && pan.current && transform.scale > 1) {
      setTransform((prev) => ({
        ...prev,
        x: event.clientX - pan.current!.x,
        y: event.clientY - pan.current!.y,
      }));
    }
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    pinch.current?.pointers.delete(event.pointerId);
    if (!pinch.current?.pointers.size) {
      pan.current = null;
      if (transform.scale <= 1.02) resetZoom();
    }
  };

  const onDoubleClick = () => {
    setTransform((prev) => (prev.scale > 1 ? { scale: 1, x: 0, y: 0 } : { scale: 2.2, x: 0, y: 0 }));
  };

  const neighbors = [active - 2, active - 1, active, active + 1, active + 2].filter(
    (i) => i >= 0 && i < count,
  );

  return (
    <div
      className={`${styles.backdrop}${reducedMotion ? ` ${styles.still}` : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={c.gallery}
      ref={dialogRef}
      tabIndex={-1}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.header}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onClose}
          aria-label={c.closeViewer}
        >
          <X aria-hidden="true" />
        </button>
        {count > 1 ? (
          <span className={styles.counter} aria-live="polite">
            <bdi dir="ltr">
              {format(active + 1).padStart(2, "0")} / {format(count).padStart(2, "0")}
            </bdi>
          </span>
        ) : null}
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => void onShare()}
          aria-label={c.share}
        >
          <Share2 aria-hidden="true" />
        </button>
      </div>

      {copied ? <p className={styles.toast}>{c.linkCopied}</p> : null}

      <div
        ref={stageRef}
        className={styles.stage}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClick}
      >
        {count > 1 ? (
          <button
            type="button"
            className={`${styles.nav} ${styles.prev}`}
            onClick={() => onGoTo(active - 1)}
            disabled={active === 0}
            aria-label={c.previousView}
          >
            <PreviousIcon aria-hidden="true" />
          </button>
        ) : null}
        <div
          className={styles.image}
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          }}
        >
          {renderSlide(slides[active])}
        </div>
        {count > 1 ? (
          <button
            type="button"
            className={`${styles.nav} ${styles.next}`}
            onClick={() => onGoTo(active + 1)}
            disabled={active === count - 1}
            aria-label={c.nextView}
          >
            <NextIcon aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {count > 1 ? (
        <div className={styles.thumbs} role="group" aria-label={c.views}>
          {neighbors.map((index) => (
            <button
              key={index}
              type="button"
              className={`${styles.thumb}${index === active ? ` ${styles.active}` : ""}`}
              onClick={() => onGoTo(index)}
              aria-pressed={index === active}
              aria-label={`${c.view} ${format(index + 1)}`}
            >
              {slides[index].kind === "photo" ? (
                <ProductMedia
                  product={product}
                  imageIndex={(slides[index] as { index: number }).index}
                  showStatusBadge={false}
                  sizes="64px"
                />
              ) : (
                <ProductMedia
                  product={product}
                  imageIndex={0}
                  showStatusBadge={false}
                  preserveTransparentBackground
                  sizes="64px"
                />
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
