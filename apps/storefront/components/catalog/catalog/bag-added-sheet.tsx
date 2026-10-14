"use client";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, X } from "lucide-react";
import type { Product } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { ProductMedia } from "@/components/product/listing";
import { productCopy } from "@/lib/catalog/products";
import { productPrice } from "@/lib/money";
import "./bag-added-sheet.css";

/** Must match the CSS transition duration below, so the unmount is delayed
 * exactly long enough for the exit animation to finish rather than cutting
 * it short or leaving a dead gap after it completes. */
const EXIT_MS = 220;
/** Downward drag distance that commits a dismiss, same magnitude as the
 * PDP's own card-drag dismiss threshold (see transition/product-overlay.tsx). */
const DRAG_DISMISS_PX = 100;

export function BagAddedSheet({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const { locale, href } = useLocale();
  const dialog = useRef<HTMLDialogElement>(null);
  // Two-phase mount so the entry transitions *from* an off-screen/transparent
  // starting style instead of the dialog just appearing — the native
  // `showModal()` open itself has no animation, so this is driven by hand.
  const [phase, setPhase] = useState<"entering" | "open" | "closing">(
    "entering",
  );
  const [reducedMotion, setReducedMotion] = useState(false);
  const [dragY, setDragY] = useState(0);
  const dragStartY = useRef(0);
  const dragging = useRef(false);

  useEffect(() => {
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, []);

  useEffect(() => {
    const node = dialog.current;
    const trigger = document.activeElement;
    const overflow = document.body.style.overflow;
    node?.showModal();
    document.body.style.overflow = "hidden";
    const raf = requestAnimationFrame(() => setPhase("open"));
    return () => {
      cancelAnimationFrame(raf);
      node?.close();
      document.body.style.overflow = overflow;
      if (trigger instanceof HTMLElement) trigger.focus();
    };
  }, []);

  // Every dismissal path (backdrop, Escape, close button, continue, drag,
  // go-to-bag) routes through here so the exit always gets the same
  // animation instead of some paths closing abruptly.
  const requestClose = () => {
    if (phase === "closing") return;
    if (reducedMotion) {
      onClose();
      return;
    }
    setPhase("closing");
    window.setTimeout(onClose, EXIT_MS);
  };

  const onHandlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartY.current = event.clientY;
    dragging.current = true;
  };
  const onHandlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    setDragY(Math.max(0, event.clientY - dragStartY.current));
  };
  const endDrag = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (dragY > DRAG_DISMISS_PX) {
      requestClose();
    } else {
      setDragY(0);
    }
  };

  const translateY =
    phase === "open" ? dragY : phase === "entering" ? 24 : 0;
  const style = reducedMotion
    ? undefined
    : {
        transform: `translateY(${phase === "closing" ? "100%" : `${translateY}px`})`,
        opacity: phase === "entering" ? 0 : 1,
        // Only suppressed mid-drag, so it stays live-tracking the pointer
        // 1:1 (Apple §1/§2); the moment the pointer releases — whether that
        // snaps back to rest or commits into the close animation — the
        // transition re-enables and the browser eases from wherever the
        // drag left off, not from a reset value.
        transition: dragging.current
          ? "none"
          : `transform ${EXIT_MS}ms cubic-bezier(0.32,0.72,0,1), opacity ${EXIT_MS}ms ease-out`,
      };

  return (
    <dialog
      ref={dialog}
      className="bag-added-sheet"
      style={style}
      data-phase={reducedMotion ? undefined : phase}
      aria-labelledby="bag-added-title"
      onCancel={(e) => {
        e.preventDefault();
        requestClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientY < r.top ||
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY > r.bottom
          )
            requestClose();
        }
      }}
    >
      <div
        className="bag-added-handle-area"
        onPointerDown={onHandlePointerDown}
        onPointerMove={onHandlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div className="bag-added-handle" />
      </div>
      <button
        className="bag-added-close"
        onClick={requestClose}
        aria-label={locale === "fa" ? "بستن" : "Close"}
      >
        <X />
      </button>
      <div className="bag-added-product">
        <span className="bag-added-photo">
          <ProductMedia
            product={product}
            showStatusBadge={false}
            sizes="88px"
          />
        </span>
        <div>
          <h2 id="bag-added-title">{productCopy(product, locale).name}</h2>
          <b>{productPrice(product, locale)}</b>
        </div>
      </div>
      <p className="bag-added-status">
        <CheckCircle2 />
        {locale === "fa" ? "به کیسه خرید اضافه شد." : "Added to your bag."}
      </p>
      <Link
        className="bag-added-primary"
        href={href("/cart")}
        onClick={requestClose}
      >
        {locale === "fa" ? "رفتن به کیسه" : "Go to bag"}
        <ArrowLeft />
      </Link>
      <button className="bag-added-continue" onClick={requestClose}>
        {locale === "fa" ? "ادامه دیدن آثار" : "Continue browsing"}
      </button>
    </dialog>
  );
}
