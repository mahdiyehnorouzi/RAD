"use client";
import { useState } from "react";
import type { Product } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { artworkVisual } from "@/lib/catalog/artwork";
import {
  categoryDefaultImage,
  isFileProductImage,
  productPhotoSrc,
} from "@/lib/catalog/category-defaults";
import { catalogPhotoSlugs, catalogPhotoSrc } from "@/lib/catalog/photo-works";
import { ArtworkVisual } from "../artwork-visual";
import "./product-media.css";

function ownPhotoSrc(product: Product, src?: string) {
  if (isFileProductImage(src)) return productPhotoSrc(src);
  if (catalogPhotoSlugs.has(product.slug)) return catalogPhotoSrc(product.slug);
  return productPhotoSrc(src);
}

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
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const soldBadge =
    product.status === "sold" ? <span className="sold-media-badge">{t("soldOut")}</span> : null;

  const media = product.images?.[imageIndex] ?? product.images?.[0];
  const categorySrc = categoryDefaultImage(product.category);
  const ownSrc = forceCategoryArtwork ? null : ownPhotoSrc(product, media?.src);
  const overlaySrc = ownSrc && ownSrc !== categorySrc && failedSrc !== ownSrc ? ownSrc : null;

  const label = locale === "fa" ? (media?.alt || product.name) : (media?.enAlt || product.en.name);

  if (failedSrc === categorySrc) {
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

  return (
    <>
      <img
        className="product-photo product-photo-default"
        src={categorySrc}
        alt={overlaySrc ? "" : label}
        onError={() => setFailedSrc(categorySrc)}
      />
      {overlaySrc ? (
        <img
          className="product-photo"
          src={overlaySrc}
          alt={label}
          onError={() => setFailedSrc(overlaySrc)}
        />
      ) : null}
      {soldBadge}
    </>
  );
}
