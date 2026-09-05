"use client";
import Link from "next/link";
import type { Product } from "@rad/types";
import { productCopy } from "@/lib/catalog";
import { productPrice } from "@/lib/money";
import { useLocale } from "@/components/i18n";
import { FavoriteButton } from "@/components/commerce";
import { VendorBadge } from "@rad/ui";
import { categoryLabel } from "@/lib/catalog";
import { ProductMedia } from "./product-media";
import "./product-card.css";

export function ProductCard({ product, index }: { product: Product; index: number }) {
  const { locale, t, href, number } = useLocale();
  const copy = productCopy(product, locale);
  const category = categoryLabel(product.category, locale);
  return (
    <article className="product-card">
      <div className="product-media-shell">
        <FavoriteButton slug={product.slug} compact />
        <Link
          href={href(`/products/${product.slug}`)}
          className="product-art"
          aria-label={`${t("viewProduct")} ${copy.name}`}
        >
          <span className="edition">{locale === "fa" ? "۱/۱" : "1/1"}</span>
          <small className="product-index">
            RĀD / {number(27 + index).padStart(3, locale === "fa" ? "۰" : "0")}
          </small>
          <ProductMedia product={product} />
        </Link>
      </div>
      <div className="product-meta">
        <div>
          <VendorBadge vendor={product.vendor} locale={locale} />
          <small className="product-category">{category}</small>
          <h3>
            <Link href={href(`/products/${product.slug}`)}>{copy.name}</Link>
          </h3>
          <p>{copy.subtitle}</p>
        </div>
        <span>{productPrice(product, locale)}</span>
      </div>
    </article>
  );
}
