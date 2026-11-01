"use client";
import { useEffect, useRef, useState } from "react";
import type { Product } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { formatArtworkNumber, ProductMedia } from "@/components/product";
import { productCopy } from "@/lib/catalog/products";
import { productPrice } from "@/lib/money";
import { checkoutCopy } from "../const";

export function CheckoutSummary({
  items,
  total,
  amountDigits,
}: {
  items: Product[];
  /** Already formatted for the current locale. */
  total: string;
  /** Digits to place on the clipboard. Shown only on the payment step. */
  amountDigits?: string;
}) {
  const { locale, number } = useLocale();
  const c = checkoutCopy[locale];
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copyAmount() {
    if (!amountDigits) return;
    window.clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(amountDigits);
      setCopyState("copied");
      timer.current = window.setTimeout(() => setCopyState("idle"), 2500);
    } catch {
      setCopyState("error");
    }
  }

  return (
    <section
      className="checkout-summary"
      aria-labelledby="checkout-summary-title"
    >
      <h2 id="checkout-summary-title">{c.summaryTitle}</h2>
      <ul className="checkout-summary-items">
        {items.map((product) => (
          <li key={product.slug} className="checkout-summary-item">
            <span className="checkout-summary-art">
              <ProductMedia
                product={product}
                showStatusBadge={false}
                sizes="68px"
              />
            </span>
            <span className="checkout-summary-text">
              <small dir="ltr">
                {formatArtworkNumber(product, number, locale)}
              </small>
              <b>{productCopy(product, locale).name}</b>
              <span>{productPrice(product, locale)}</span>
            </span>
          </li>
        ))}
      </ul>
      <dl className="checkout-summary-rows">
        <div>
          <dt>{c.subtotal}</dt>
          <dd>{total}</dd>
        </div>
        <div>
          <dt>{c.shipping}</dt>
          <dd>{c.shippingUnset}</dd>
        </div>
        <div className="checkout-summary-total">
          <dt>{c.total}</dt>
          <dd>
            <span>{total}</span>
            {amountDigits ? (
              <button
                type="button"
                className="checkout-summary-copy"
                data-state={copyState}
                onClick={() => void copyAmount()}
              >
                {copyState === "error"
                  ? c.copyFailed
                  : copyState === "copied"
                    ? c.copied
                    : c.copyAmount}
              </button>
            ) : null}
          </dd>
        </div>
      </dl>
      {amountDigits ? (
        <p
          className="checkout-summary-live"
          role={copyState === "error" ? "alert" : "status"}
        >
          {copyState === "copied"
            ? c.copied
            : copyState === "error"
              ? c.copyFailed
              : ""}
        </p>
      ) : null}
    </section>
  );
}
