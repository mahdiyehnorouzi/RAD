"use client";

import { ArtworkVisual } from "../artwork-visual";
import { useLocale } from "@/components/i18n";
import { artworkVisual } from "@/lib/catalog/artwork";
import type {Product} from "@rad/types";

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
      <span className="sold-media-badge">
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
          className="product-photo"
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
