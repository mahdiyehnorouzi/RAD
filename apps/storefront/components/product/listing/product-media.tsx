"use client";
import { useState } from "react";
import type { Product } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { artworkVisual, artworkCategoryById } from "@/lib/catalog/artwork";
import {
  isFileProductImage,
  productPhotoSrc,
} from "@/lib/catalog/category-defaults";
import {
  catalogLifestylePhotoSrc,
  catalogPhotoSrc,
  hasStudioPhotos,
} from "@/lib/catalog/photo-works";
import { ArtworkVisual } from "../artwork-visual";
import { useProductStatus } from "@/hooks/use-product-status";
import "./product-media.css";

function ownPhotoSrc(
  product: Product,
  imageIndex: number,
  src?: string,
  preserveTransparentBackground = false,
) {
  if (hasStudioPhotos(product)) {
    return preserveTransparentBackground
      ? catalogPhotoSrc(product.slug, imageIndex)
      : catalogLifestylePhotoSrc(product.slug, imageIndex);
  }
  if (isFileProductImage(src)) return productPhotoSrc(src);
  if (src) return null;
  return null;
}

export function ProductMedia({
  product,
  imageIndex = 0,
  forceCategoryArtwork = false,
  showStatusBadge = true,
  preserveTransparentBackground = false,
}: {
  product: Product;
  imageIndex?: number;
  forceCategoryArtwork?: boolean;
  showStatusBadge?: boolean;
  preserveTransparentBackground?: boolean;
}) {
  const { locale } = useLocale();
  const { badge } = useProductStatus(product);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const soldBadge =
    showStatusBadge && badge ? (
      <span className="sold-media-badge">{badge}</span>
    ) : null;

  const media = product.images?.[imageIndex] ?? product.images?.[0];
  const ownSrc = forceCategoryArtwork
    ? null
    : ownPhotoSrc(
        product,
        imageIndex,
        media?.src,
        preserveTransparentBackground,
      );
  const src = ownSrc && failedSrc !== ownSrc ? ownSrc : null;
  const label =
    locale === "fa"
      ? media?.alt || product.name
      : media?.enAlt || product.en.name;
  const preview = artworkCategoryById(product.category).preview;

  if (!src) {
    return (
      <>
        <ArtworkVisual
          className="product-photo-default"
          visual={artworkVisual(product)}
          color={media?.color ?? product.color ?? preview.color}
          accent={media?.accent ?? product.accent ?? preview.accent}
          shape={media?.shape ?? product.shape ?? "round"}
        />
        {soldBadge}
      </>
    );
  }

  return (
    <>
      <img
        className="product-photo"
        src={src}
        alt={label}
        onError={() => setFailedSrc(src)}
      />
      {soldBadge}
    </>
  );
}
