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
    <article className="relative min-w-0">
      <div className="relative">
        <FavoriteButton slug={product.slug} compact />
        <Link
          href={href(`/products/${product.slug}`)}
          className="product-art-shell relative grid aspect-[4/5] place-items-center overflow-hidden bg-rad-sand transition-colors duration-[600ms] ease-out hover:bg-[color-mix(in_srgb,theme(colors.rad.sand)_82%,theme(colors.rad.paper))]"
          aria-label={`${t("viewProduct")} ${copy.name}`}
        >
          <span className="absolute bottom-5 start-[1.2rem] z-[3] grid h-12 w-12 place-items-center rounded-full border border-current bg-rad-paper/80 text-caption backdrop-blur-[4px]">
            {t("editionMark")}
          </span>
          <small
            className="absolute bottom-[1.35rem] end-5 z-[3] text-[0.7rem] font-normal tracking-[0.11em]"
            dir="ltr"
          >
            RĀD / {number(27 + index).padStart(3, locale === "fa" ? "۰" : "0")}
          </small>
          <ProductMedia product={product} />
        </Link>
      </div>
      <div className="mt-4 flex flex-col items-stretch gap-1.5">
        <div>
          <VendorBadge vendor={product.vendor} locale={locale} label={guest} />
          <small className="mb-1 inline-block text-eyebrow text-rad-clay">
            {category}
          </small>
          <h3 className="m-0 text-product-title font-normal">
            <Link href={href(`/products/${product.slug}`)}>{copy.name}</Link>
          </h3>
          <p className="mt-0.5 text-sm text-rad-muted">{copy.subtitle}</p>
        </div>
        <span className="text-price">{productPrice(product)}</span>
      </div>
    </article>
  );
}
