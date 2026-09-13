"use client";
import Link from "next/link";
import type { Product } from "@rad/types";
import { productCopy } from "@/lib/catalog/products";
import { productCardPriceParts } from "@/lib/money";
import { useLocale } from "@/components/i18n";
import { FavoriteButton } from "@/components/commerce";
import { categoryLabel } from "@/lib/catalog/artwork";
import { ProductCardArtwork } from "./product-card-artwork";
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
  const unavailable =
    product.status === "sold" || product.status === "reserved";
  const statusLabel =
    product.status === "reserved" ? t("reserved") : t("soldOut");
  const artworkNumber = formatArtworkNumber(product, number, locale);
  const artistName = product.vendor
    ? locale === "fa"
      ? product.vendor.displayName
      : product.vendor.displayNameEn
    : locale === "fa"
      ? "استودیو رَد"
      : "RAD Studio";
  const price = productCardPriceParts(product, locale);
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
          <ProductCardArtwork
            product={product}
            artworkNumber={artworkNumber}
            edition={locale === "fa" ? "۱/۱" : "1/1"}
            forceCategoryArtwork={forceCategoryArtwork}
          />
        </Link>
      </div>
      <div className="flex justify-between w-full h-[3.2rem] align-end">
        <div>
          <p className="product-artist">
            <span>{locale === "fa" ? "اثری از" : "A work by"}</span>
            <strong>{artistName}</strong>
          </p>
          <div className="flex flex-col">
            <h3 className="!mt-2">
              <Link
                href={href(`/products/${product.slug}`)}
                className="product-card-name"
              >
                {copy.name}
              </Link>
            </h3>
            <small className="product-category mt-1">{category}</small>
          </div>
        </div>
        <div className="product-price">
          <span className="product-price-amount">{price.amount}</span>
          {price.unit ? (
            <span className="product-price-unit">{price.unit}</span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
