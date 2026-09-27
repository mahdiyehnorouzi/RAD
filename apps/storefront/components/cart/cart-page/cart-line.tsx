"use client";

import Link from "next/link";
import type { CartPriceAtAdd, Product } from "@rad/types";
import { LinkPending, ProductMedia } from "@/components/product";
import { useLocale } from "@/components/i18n";
import { productCopy } from "@/lib/catalog/products";
import { formatTotal, priceToNumber, productPrice } from "@/lib/money";
import { formatCountdown } from "@/lib/catalog/product-status";
import { useCountdown } from "@/hooks/use-countdown";

export type CartLineIssue =
  "withdrawn" | "sold" | "reserved" | "unavailable" | null;

export function priceChange(
  product: Product,
  atAdd: CartPriceAtAdd | undefined,
): { toman: [number, number]; usd: [number, number] } | null {
  if (!atAdd) return null;
  const toman = priceToNumber(product.price);
  if (toman === atAdd.toman && product.usdPrice === atAdd.usd) return null;
  return { toman: [atAdd.toman, toman], usd: [atAdd.usd, product.usdPrice] };
}

export function CartLine({
  slug,
  product,
  issue,
  changed,
  removing,
  onRemove,
}: {
  slug: string;
  product?: Product;
  issue: CartLineIssue;
  changed: ReturnType<typeof priceChange>;
  removing: boolean;
  onRemove: () => void;
}) {
  const { locale, t, href, number } = useLocale();
  const reservedLeft = useCountdown(
    issue === "reserved" ? product?.reservedUntil : null,
  );
  const removeButton = (
    <button type="button" onClick={onRemove} disabled={removing}>
      {removing ? t("removing") : t("removeBag")}
    </button>
  );

  if (!product) {
    return (
      <article className="cart-item is-blocked">
        <span className="cart-art cart-art--missing" aria-hidden="true" />
        <div className="cart-item-copy">
          <span>{t("uniquePiece")}</span>
          <h2 dir="ltr">{slug}</h2>
          <p className="cart-unavailable" role="status">
            {issue === "withdrawn"
              ? t("cartItemWithdrawn")
              : t("catalogStaleNotice")}
          </p>
          {removeButton}
        </div>
      </article>
    );
  }

  const copy = productCopy(product, locale);
  const issueText =
    issue === "sold"
      ? t("cartItemSold")
      : issue === "reserved"
        ? t("cartItemReserved", {
            time: formatCountdown(reservedLeft ?? 0, locale, number),
          })
        : issue === "withdrawn"
          ? t("cartItemWithdrawn")
          : issue === "unavailable"
            ? t("statusUnavailable")
            : null;
  const [from, to] = changed
    ? locale === "fa"
      ? changed.toman
      : changed.usd
    : [0, 0];

  return (
    <article className={`cart-item${issue ? " is-blocked" : ""}`}>
      <Link href={href(`/products/${product.slug}`)} className="cart-art">
        <span className="cart-media">
          <ProductMedia product={product} />
        </span>
        <LinkPending />
      </Link>
      <div className="cart-item-copy">
        <span>{t("uniquePiece")}</span>
        <h2>
          <Link href={href(`/products/${product.slug}`)}>{copy.name}</Link>
        </h2>
        <p>{copy.subtitle}</p>
        {issueText ? (
          <p className="cart-unavailable" role="status">
            {issueText}
          </p>
        ) : null}
        {changed && !issue ? (
          <p className="cart-price-changed" role="status">
            {t("cartPriceChanged", {
              from: formatTotal(from, locale),
              to: formatTotal(to, locale),
            })}
          </p>
        ) : null}
        {removeButton}
      </div>
      <strong className={issue ? "is-struck" : undefined}>
        {productPrice(product, locale)}
      </strong>
    </article>
  );
}
