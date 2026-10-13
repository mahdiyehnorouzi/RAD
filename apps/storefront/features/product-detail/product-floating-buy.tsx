"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import type { Product } from "@rad/types";
import { AddToBag } from "@/components/catalog/catalog/catalog";
import { useLocale } from "@/components/i18n";
import { productPrice } from "@/lib/money";
import { pdpCopy } from "./const";
import type { LiveProduct } from "./hooks";
import type { PurchaseState } from "./type";
import styles from "./product-floating-buy.module.css";

const COMPACT_SCROLL_Y = 280;

/**
 * The inline Add to Bag button (in ProductSummary) is the one real CTA;
 * this bar is its understudy, shown only once that inline button has
 * scrolled out of view (`visible`, driven by an IntersectionObserver in
 * ProductDetail — never an arbitrary scrollY threshold). It stays mounted
 * at all times and is only hidden/shown via transform+opacity, so an
 * in-flight add isn't interrupted by the inline CTA scrolling in/out.
 *
 * Geometry (height, radius, width, padding) is identical across every
 * purchase state — available/loading/added/reserved/sold only ever change
 * the content inside the pill, never its outer shape. AddToBag is reused
 * unmodified for the actual mutation; only its busy state is mirrored here
 * to drive this bar's own loading chrome, and its built-in confirmation
 * sheet is suppressed here (`hideSheet`) since the inline CTA owns that.
 */
export function ProductFloatingBuy({
  product,
  state,
  live,
  forceBusy = false,
  visible = true,
}: {
  product: Product;
  state: PurchaseState;
  live: LiveProduct;
  /** Dev-only: force the "adding" visual without a real mutation. */
  forceBusy?: boolean;
  /** Whether the inline CTA is currently out of view (so this bar should show). */
  visible?: boolean;
}) {
  const { locale, t, href } = useLocale();
  const c = pdpCopy[locale];
  const [compact, setCompact] = useState(false);
  const [busy, setBusy] = useState(false);
  // Points toward forward navigation (into the cart), mirrored per locale —
  // not a loading/decorative mark, which is why the "added" state never
  // reuses the spinner glyph.
  const Forward = locale === "fa" ? ChevronLeft : ChevronRight;

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > COMPACT_SCROLL_Y);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const unavailable = state.sold || state.withdrawn || state.reserved;
  // Derive the label from the boolean flags, not `state.label` — that
  // string reflects the real product's live status and can disagree with
  // an overridden/derived `sold`/`reserved` flag (e.g. the dev QA override,
  // or `withdrawn`, which has no corresponding `label` of its own).
  const unavailableLabel = state.reserved
    ? c.reservedNow
    : state.sold || state.withdrawn
      ? t("soldOut")
      : (state.label ?? t("soldOut"));
  const isBusy = busy || forceBusy;

  return (
    <div
      className={`pdp-floating-bar ${styles.bar}${compact ? ` ${styles.compact}` : ""}`}
      role="region"
      aria-label={t("addBag")}
      aria-hidden={!visible}
      data-hidden={!visible}
    >
      <div className={styles.action}>
        {unavailable ? (
          <div className="add-to-bag">
            <button
              type="button"
              className={`button add ${styles.disabledPill}`}
              disabled
            >
              {unavailableLabel}
            </button>
          </div>
        ) : state.inBag ? (
          <Link
            className={styles.goToBagPill}
            href={href("/cart")}
            tabIndex={visible ? undefined : -1}
          >
            <Forward className={styles.goToBagArrow} aria-hidden="true" />
            {t("goToBag")}
            <ShoppingBag aria-hidden="true" />
          </Link>
        ) : forceBusy ? (
          <div className="add-to-bag">
            <button type="button" className="button add" disabled>
              <span className={styles.spinner} aria-hidden="true" />
              {c.addingBag}
            </button>
          </div>
        ) : (
          <AddToBag
            product={product}
            onConflict={() => void live.check()}
            icon={<ShoppingBag aria-hidden="true" />}
            busyLabel={c.addingBag}
            onBusyChange={setBusy}
            hideSheet
          />
        )}
      </div>
      <span className={styles.divider} aria-hidden="true" />
      <div className={styles.price}>{productPrice(product, locale)}</div>
      {isBusy ? <span className="sr-only">{c.addingBag}</span> : null}
    </div>
  );
}
