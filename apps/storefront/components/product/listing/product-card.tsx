"use client";
import Link from "next/link";
import type { Product } from "@rad/types";
import { productCopy } from "@/lib/catalog/products";
import { productPrice } from "@/lib/money";
import { useLocale } from "@/components/i18n";
import { FavoriteButton } from "@/components/commerce";
import { categoryLabel } from "@/lib/catalog/artwork";
import { ProductMedia } from "./product-media";
import { formatArtworkNumber } from "./const";
import "./product-card.css";

export function ProductCard({
  product,
  forceCategoryArtwork = false,
}: {
  product: Product;
  index?: number;
  forceCategoryArtwork?: boolean;
}) {
  const { locale, t, href, number } = useLocale();
  const copy = productCopy(product, locale);
  const category = categoryLabel(product.category, locale);
  const unavailable = product.status === "sold" || product.status === "reserved";
  const statusLabel = product.status === "reserved" ? t("reserved") : t("soldOut");
  const artworkNumber = formatArtworkNumber(product, number, locale);
  const artistName = product.vendor
    ? locale === "fa"
      ? product.vendor.displayName
      : product.vendor.displayNameEn
    : locale === "fa"
      ? "استودیو رَد"
      : "RAD Studio";
  return (
    <article className={`product-card${unavailable ? " is-unavailable" : ""}`}>
      <div className="product-media-shell">
        <FavoriteButton slug={product.slug} compact />
        {unavailable ? (
          <span className="product-status-badge">{statusLabel}</span>
        ) : null}
        <Link
          href={href(`/products/${product.slug}`)}
          className="product-art"
          aria-label={`${t("viewProduct")} ${copy.name}`}
        >
          <span className="edition">{locale === "fa" ? "۱/۱" : "1/1"}</span>
          <span className="product-artwork">
            <ProductMedia
              product={product}
              forceCategoryArtwork={forceCategoryArtwork}
              showStatusBadge={false}
            />
          </span>
          {artworkNumber ? <small className="product-index">{artworkNumber}</small> : null}
        </Link>
      </div>
      <div className="product-meta">
        <p className="product-artist">
          <span>{locale === "fa" ? "اثری از" : "A work by"}</span>
          <strong>{artistName}</strong>
        </p>
        <h3>
          <Link href={href(`/products/${product.slug}`)}>{copy.name}</Link>
        </h3>
        <div className="product-facts">
          <small className="product-category">{category}</small>
          <span className="product-price">{productPrice(product, locale)}</span>
        </div>
      </div>
    </article>
  );
}
