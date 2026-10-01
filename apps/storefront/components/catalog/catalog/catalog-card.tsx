"use client";

import Link from "next/link";
import type { Product } from "@rad/types";
import { FavoriteButton } from "@/components/commerce";
import { useLocale } from "@/components/i18n";
import {
  formatRadDigits,
  LinkPending,
  ProductCardArtwork,
  ProductCardBadge,
  ProductCardQr,
  productCardCopy,
  type ProductBadgeTone,
} from "@/components/product/listing";
import { useProductStatus } from "@/hooks/use-product-status";
import { productCopy } from "@/lib/catalog/products";
import { productFullPriceParts } from "@/lib/money";
import { cardTear } from "../const";
import { CatalogTear } from "./catalog-tear";
import "@/components/product/listing/product-card/product-card.css";
import "./catalog-card.css";

/** Shop-floor card: photograph with a pencilled number, a torn paper label beneath. */
export function CatalogCard({ product }: { product: Product }) {
  const { locale, href, number, t } = useLocale();
  const c = productCardCopy[locale];
  const copy = productCopy(product, locale);
  const { status, label, inBag, reserved, purchasable } =
    useProductStatus(product);

  const productHref = href(`/products/${product.slug}`);
  const digits = Number(product.artworkNumber?.replace(/\D/g, "") || 0);
  const markDigits = digits ? formatRadDigits(digits, number, locale) : "";
  const price = productFullPriceParts(product, locale);
  const maker = product.vendor
    ? locale === "fa"
      ? product.vendor.displayName
      : product.vendor.displayNameEn
    : c.maker;
  const unavailable = Boolean(status) && !purchasable && !inBag;

  const badge: { tone: ProductBadgeTone; label: string } | null = inBag
    ? { tone: "bag", label: c.inBag }
    : status === "sold" && !reserved && label
      ? { tone: "sold", label }
      : label && status !== "available"
        ? { tone: "neutral", label }
        : null;

  return (
    <article className={`plp-card${unavailable ? " is-unavailable" : ""}`}>
      <div className="plp-card-stage">
        <Link
          href={productHref}
          className="plp-card-art"
          tabIndex={-1}
          aria-hidden="true"
        >
          <ProductCardArtwork product={product} />
          <LinkPending />
        </Link>
        {markDigits ? (
          <span className="plp-card-mark" aria-hidden="true">
            <b>{markDigits}</b>
            <svg viewBox="0 0 64 10" focusable="false">
              <path d="M2 7.2c9-3.4 19.6-4.4 30.2-3.2 9.6 1.1 19.4 1.2 29.8-2.4" />
            </svg>
            <small>RĀD</small>
          </span>
        ) : null}
        <div className="plp-card-flags">
          <FavoriteButton slug={product.slug} compact />
          {badge ? (
            <ProductCardBadge tone={badge.tone} label={badge.label} />
          ) : null}
        </div>
      </div>
      <div className="plp-card-body">
        <CatalogTear shape={cardTear} className="plp-card-tear" />
        <h3 className="plp-card-name">
          <Link href={productHref}>{copy.name}</Link>
        </h3>
        <div className="plp-card-meta">
          <p className="plp-card-maker">
            {c.by} {maker}
          </p>
          <p className="plp-card-price">
            <b>{price.amount}</b>
            {price.unit ? <span>{price.unit}</span> : null}
          </p>
        </div>
        {markDigits ? (
          <p className="plp-card-archive">
            <span>{t("archiveNumber")}</span>
            <bdi dir="ltr">RĀD / {markDigits}</bdi>
          </p>
        ) : null}
        <ProductCardQr product={product} name={copy.name} />
      </div>
    </article>
  );
}
