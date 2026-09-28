"use client";
import Link from "next/link";
import type { Product } from "@rad/types";
import { productCopy } from "@/lib/catalog/products";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { productCardPriceParts, productPrice } from "@/lib/money";
import { useLocale } from "@/components/i18n";
import { FavoriteButton } from "@/components/commerce";
import { categoryLabel } from "@/lib/catalog/artwork";
import { isUpcomingStatus } from "@/lib/catalog/product-status";
import { ProductCardArtwork } from "./product-card-artwork";
import { formatArtworkNumber } from "./const";
import { LinkPending } from "./link-pending";
import { useProductStatus } from "@/hooks/use-product-status";
import "./product-card.css";

export function ProductCard({
  product,
  forceCategoryArtwork = false,
  variant = "default",
}: {
  product: Product;
  index?: number;
  forceCategoryArtwork?: boolean;
  /** `catalog` is the shop-floor plate: status on the photo, number and price below. */
  variant?: "default" | "catalog";
}) {
  const { locale, t, href, number } = useLocale();
  const copy = productCopy(product, locale);
  const category = categoryLabel(product.category, locale);
  const {
    badge: statusLabel,
    label: statusText,
    purchasable,
    inBag,
    reserved,
  } = useProductStatus(product);
  const unavailable = Boolean(product.status) && !purchasable && !inBag;
  const artworkNumber = formatArtworkNumber(product, number, locale);
  const productHref = href(`/products/${product.slug}`);

  if (variant === "catalog") {
    const tone = inBag
      ? "bag"
      : reserved
        ? "reserved"
        : isUpcomingStatus(product.status)
          ? "upcoming"
          : (product.status ?? "none");
    const Arrow = locale === "fa" ? ArrowLeft : ArrowRight;
    return (
      <article
        className={`product-card product-card--catalog${unavailable ? " is-unavailable" : ""}`}
      >
        <div className="product-media-shell">
          <FavoriteButton slug={product.slug} compact />
          <Link
            href={productHref}
            className="product-art"
            aria-label={`${t("viewProduct")} ${copy.name}`}
          >
            <ProductCardArtwork
              product={product}
              artworkNumber={artworkNumber}
              edition={locale === "fa" ? "۱/۱" : "1/1"}
              forceCategoryArtwork={forceCategoryArtwork}
            />
            <LinkPending />
          </Link>
          {statusText ? (
            <span className="product-status-pill" data-tone={tone}>
              <i aria-hidden="true" />
              {statusText}
            </span>
          ) : null}
        </div>
        <Link href={productHref} className="product-plate" tabIndex={-1}>
          {artworkNumber ? (
            <small className="product-plate-number">{artworkNumber}</small>
          ) : null}
          <h3 className="product-plate-name">{copy.name}</h3>
          <span className="product-plate-foot">
            <Arrow aria-hidden="true" />
            <span className="product-plate-price">
              {productPrice(product, locale)}
            </span>
          </span>
        </Link>
      </article>
    );
  }
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
        {statusLabel ? (
          <span className="product-status-badge">{statusLabel}</span>
        ) : null}
        <Link
          href={productHref}
          className="product-art"
          aria-label={`${t("viewProduct")} ${copy.name}`}
        >
          <ProductCardArtwork
            product={product}
            artworkNumber={artworkNumber}
            edition={locale === "fa" ? "۱/۱" : "1/1"}
            forceCategoryArtwork={forceCategoryArtwork}
          />
          <LinkPending />
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
                href={productHref}
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
