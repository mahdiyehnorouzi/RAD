"use client";
import type { Product } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { formatArtworkNumber, ProductMedia } from "@/components/product";
import { productCopy } from "@/lib/catalog/products";
import { checkoutCopy, fillCopy } from "../const";

export function CheckoutSummary({
  items,
  total,
}: {
  items: Product[];
  /** Already formatted for the current locale. */
  total: string;
}) {
  const { locale, number } = useLocale();
  const c = checkoutCopy[locale];

  return (
    <section className="checkout-summary" aria-labelledby="checkout-summary-title">
      <h2 id="checkout-summary-title">{c.summaryTitle}</h2>
      <ul className="checkout-summary-items">
        {items.map((product) => (
          <li key={product.slug} className="checkout-summary-item">
            <span className="checkout-summary-art">
              <ProductMedia product={product} showStatusBadge={false} />
            </span>
            <span className="checkout-summary-text">
              <small dir="ltr">{formatArtworkNumber(product, number, locale)}</small>
              <b>{productCopy(product, locale).name}</b>
              <span>{fillCopy(c.quantity, { count: number(1) })}</span>
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
          <dd>{c.free}</dd>
        </div>
        <div className="checkout-summary-total">
          <dt>{c.total}</dt>
          <dd>{total}</dd>
        </div>
      </dl>
    </section>
  );
}
