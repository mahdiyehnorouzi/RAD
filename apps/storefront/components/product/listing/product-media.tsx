"use client";
import { ImageOff } from "lucide-react";
import type { Product } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { artworkVisual } from "@/lib/catalog";
import { ArtworkVisual } from "../artwork-visual";
import "./product-media.css";

export function ProductMedia({
  product,
  imageIndex = 0,
}: {
  product: Product;
  imageIndex?: number;
}) {
  const { locale, t } = useLocale();
  const soldBadge =
    product.status === "sold" ? <span className="sold-media-badge">{t("soldOut")}</span> : null;

  if (product.images && product.images.length === 0) {
    return (
      <>
        <div className="product-fallback">
          <ImageOff aria-hidden="true" />
          <span>{t("imageUnavailable")}</span>
        </div>
        {soldBadge}
      </>
    );
  }
  const media = product.images?.[imageIndex] ?? product.images?.[0];
  const photoSrc = media?.src
    ? media.src.startsWith("/catalog/")
      ? `/backend${media.src}`
      : media.src
    : undefined;
  if (photoSrc) {
    return (
      <>
        <img
          className="product-photo"
          src={photoSrc}
          alt={locale === "fa" ? media?.alt : media?.enAlt}
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
