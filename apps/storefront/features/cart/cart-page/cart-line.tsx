"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import type { CartPriceAtAdd, Product } from "@rad/types";
import { LinkPending, ProductMedia } from "@/components/product";
import { useLocale } from "@/components/i18n";
import { productCopy } from "@/lib/catalog/products";
import { formatTotal, priceToNumber, productPrice } from "@/lib/money";
import { formatCountdown } from "@/lib/catalog/product-status";
import { useCountdown } from "@/hooks/use-countdown";
import { cartCopy, fillCartCopy } from "../const";
import styles from "./cart-line.module.css";

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
  const c = cartCopy[locale];
  const reservedLeft = useCountdown(
    issue === "reserved" ? product?.reservedUntil : null,
  );
  const name = product ? productCopy(product, locale).name : slug;
  const quantity = (
    <div className={styles.qty}>
      <span>{c.quantity}</span>
      <b>{number(1)}</b>
      <button
        type="button"
        className={styles.remove}
        onClick={onRemove}
        disabled={removing}
        aria-label={fillCartCopy(c.remove, { name })}
        title={removing ? t("removing") : t("removeBag")}
      >
        <Trash2 aria-hidden="true" />
      </button>
    </div>
  );

  if (!product) {
    return (
      <article
        className={`${styles.line} ${styles.blocked}`}
        aria-busy={removing}
      >
        <span
          className={`${styles.art} ${styles.missing}`}
          aria-hidden="true"
        />
        <div className={styles.copy}>
          <h2 dir="ltr">{slug}</h2>
          <p className={styles.notice} role="status">
            {issue === "withdrawn"
              ? t("cartItemWithdrawn")
              : t("catalogStaleNotice")}
          </p>
        </div>
        {quantity}
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
    <article
      className={issue ? `${styles.line} ${styles.blocked}` : styles.line}
      aria-busy={removing}
    >
      <Link
        href={href(`/products/${product.slug}`)}
        className={styles.art}
        tabIndex={-1}
        aria-hidden="true"
      >
        <ProductMedia product={product} showStatusBadge={false} />
        <LinkPending />
      </Link>
      <div className={styles.copy}>
        <h2>
          <Link href={href(`/products/${product.slug}`)}>{copy.name}</Link>
        </h2>
        <p>{copy.subtitle}</p>
        <strong className={issue ? styles.struck : undefined}>
          {productPrice(product, locale)}
        </strong>
        {issueText ? (
          <p className={styles.notice} role="status">
            {issueText}
          </p>
        ) : null}
        {changed && !issue ? (
          <p className={styles.notice} role="status">
            {t("cartPriceChanged", {
              from: formatTotal(from, locale),
              to: formatTotal(to, locale),
            })}
          </p>
        ) : null}
      </div>
      {quantity}
    </article>
  );
}
