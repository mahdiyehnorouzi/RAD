"use client";
import { useState } from "react";
import type { Product } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { artworkVisual, artworkCategoryById } from "@/lib/catalog/artwork";
import { isFileProductImage, productPhotoSrc } from "@/lib/catalog/category-defaults";
import { catalogPhotoSlugs, catalogPhotoSrc } from "@/lib/catalog/photo-works";
import { ArtworkVisual } from "../artwork-visual";
import "./product-media.css";

function ownPhotoSrc(product: Product, src?: string) {
  if (isFileProductImage(src)) return productPhotoSrc(src);
  if (src) return null;
  if (catalogPhotoSlugs.has(product.slug)) return catalogPhotoSrc(product.slug);
  return null;
}

export function ProductMedia({
  product,
  imageIndex = 0,
  forceCategoryArtwork = false,
  showStatusBadge = true,
}: {
  product: Product;
  imageIndex?: number;
  forceCategoryArtwork?: boolean;
  showStatusBadge?: boolean;
}) {
  const { locale, t } = useLocale();
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const soldBadge =
    showStatusBadge && (product.status === "sold" || product.status === "reserved") ? (
      <span className="sold-media-badge">
        {product.status === "reserved" ? t("reserved") : t("soldOut")}
      </span>
    ) : null;

  const media = product.images?.[imageIndex] ?? product.images?.[0];
  const ownSrc = forceCategoryArtwork ? null : ownPhotoSrc(product, media?.src);
  const src = ownSrc && failedSrc !== ownSrc ? ownSrc : null;
  const label = locale === "fa" ? (media?.alt || product.name) : (media?.enAlt || product.en.name);
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
