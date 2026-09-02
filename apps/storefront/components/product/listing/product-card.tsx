"use client";

import Link from "next/link";
import { VendorBadge } from "@rad/ui";
import { FavoriteButton } from "./favorite-button";
import { ProductMedia } from "./product-media";
import { useLocale } from "@/components/i18n";
import { useMoney } from "@/hooks/use-money";
import type {Product} from "@rad/types";
import { productCopy } from "@/lib/catalog/products";
import { categoryLabel } from "@/lib/catalog/artwork";
import { faCore } from "@rad/i18n/fa";
import { enCore } from "@rad/i18n/en";

export function ProductCard({
  product,
  index,
}: {
  product: Product;
  index: number;
}) {
  const { locale, t, href, number } = useLocale();
  const { productPrice } = useMoney();
  const copy = productCopy(product, locale);
  const category = categoryLabel(product.category, locale);
  const guest = locale === "fa" ? faCore.guestArtist : enCore.guestArtist;
  return (
    <article className="product-card">
      <div className="product-media-shell">
        <FavoriteButton slug={product.slug} compact />
        <Link
          href={href(`/products/${product.slug}`)}
          className="product-art"
          aria-label={`${t("viewProduct")} ${copy.name}`}
        >
          <span className="edition">{t("editionMark")}</span>
          <small className="product-index" dir="ltr">
            RĀD / {number(27 + index).padStart(3, locale === "fa" ? "۰" : "0")}
          </small>
          <ProductMedia product={product} />
        </Link>
      </div>
      <div className="product-meta">
        <div>
          <VendorBadge vendor={product.vendor} locale={locale} label={guest} />
          <small className="product-category">{category}</small>
          <h3>
            <Link href={href(`/products/${product.slug}`)}>{copy.name}</Link>
          </h3>
          <p>{copy.subtitle}</p>
        </div>
        <span>{productPrice(product)}</span>
      </div>
    </article>
  );
}
