"use client";
import { useState } from "react";
import type { Product } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { artworkVisual } from "@/lib/catalog";
import { ArtworkVisual } from "../artwork-visual";
import "./product-media.css";

export function ProductMedia({
  product,
  imageIndex = 0,
  forceCategoryArtwork = false,
}: {
  product: Product;
  imageIndex?: number;
  forceCategoryArtwork?: boolean;
}) {
  const { locale, t } = useLocale();
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const soldBadge =
    product.status === "sold" ? <span className="sold-media-badge">{t("soldOut")}</span> : null;

  const media = product.images?.[imageIndex] ?? product.images?.[0];
  const photoSrc = media?.src
    ? media.src.startsWith("/catalog/")
      ? `/backend${media.src}`
      : media.src
    : null;

  if (!forceCategoryArtwork && photoSrc && failedImage !== photoSrc) {
    return (
      <>
        <img
          className="product-photo"
          src={photoSrc}
          alt={locale === "fa" ? (media?.alt ?? "") : (media?.enAlt ?? "")}
          onError={() => setFailedImage(photoSrc)}
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
