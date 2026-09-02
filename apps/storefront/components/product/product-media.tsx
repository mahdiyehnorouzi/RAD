"use client";

import { ArtworkVisual } from "./artwork-visual";
import { useLocale } from "@/components/i18n";
import { artworkVisual } from "@/lib/artwork";
import type { Product } from "@/lib/products";

export function ProductMedia({
  product,
  imageIndex = 0,
}: {
  product: Product;
  imageIndex?: number;
}) {
  const { locale, t } = useLocale();
  const soldBadge =
    product.status === "sold" ? (
      <span className="pointer-events-none absolute end-4 top-4 z-[8] inline-flex min-h-[30px] items-center rounded-full border border-rad-paper/70 bg-rad-clay px-3 py-1 text-label font-medium text-rad-paper shadow-[0_4px_18px_rgba(24,35,31,.12)]">
        {t("soldOut")}
      </span>
    ) : null;

  const media = product.images?.[imageIndex] ?? product.images?.[0];
  if (media?.src) {
    const photoSrc = media.src.startsWith("/catalog/")
      ? `/backend${media.src}`
      : media.src;
    return (
      <>
        <img
          className="product-photo relative z-[2] max-h-full max-w-full object-contain"
          src={photoSrc}
          alt={locale === "fa" ? media.alt : media.enAlt}
        />
        {soldBadge}
      </>
    );
  }
  return (
    <>
      <ArtworkVisual
        visual={artworkVisual(product)}
        color={media?.color ?? product.color}
        accent={media?.accent ?? product.accent}
        shape={media?.shape ?? product.shape}
      />
      {soldBadge}
    </>
  );
}
