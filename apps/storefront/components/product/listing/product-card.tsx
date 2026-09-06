"use client";
import Link from "next/link";
import type { Product } from "@rad/types";
import { productCopy } from "@/lib/catalog/products";
import { productPrice } from "@/lib/money";
import { useLocale } from "@/components/i18n";
import { FavoriteButton } from "@/components/commerce";
import { VendorBadge } from "@rad/ui";
import { categoryLabel } from "@/lib/catalog/artwork";
import { ProductMedia } from "./product-media";
import "./product-card.css";

export function ProductCard({
  product,
  index,
  forceCategoryArtwork = false,
}: {
  product: Product;
  index: number;
  forceCategoryArtwork?: boolean;
}) {
  const { locale, t, href, number } = useLocale();
  const copy = productCopy(product, locale);
  const category = categoryLabel(product.category, locale);
  const productHref = href(`/products/${product.slug}`);
  return (
    <article className="product-card">
      <FavoriteButton slug={product.slug} compact />
      <Link
        href={productHref}
        className="product-card-link"
        aria-label={`${t("viewProduct")} ${copy.name}`}
      >
        <div className="product-media-shell">
          <div className="product-art">
            <span className="edition">{locale === "fa" ? "۱/۱" : "1/1"}</span>
            <small className="product-index">
              RĀD / {number(27 + index).padStart(3, locale === "fa" ? "۰" : "0")}
            </small>
            <ProductMedia product={product} forceCategoryArtwork={forceCategoryArtwork} />
          </div>
        </div>
        <div className="product-meta">
          <div>
            <VendorBadge vendor={product.vendor} locale={locale} />
            <small className="product-category">{category}</small>
            <h3>{copy.name}</h3>
            <p>{copy.subtitle}</p>
          </div>
          <span>{productPrice(product, locale)}</span>
        </div>
      </Link>
    </article>
  );
}
