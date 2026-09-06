"use client";
import { useEffect, useState } from "react";
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
    product.status === "sold" || product.status === "reserved" ? (
      <span className="sold-media-badge">{t("soldOut")}</span>
    ) : null;

  const media = product.images?.[imageIndex] ?? product.images?.[0];
  const categorySrc = categoryDefaultImage(product.category);
  const ownSrc = forceCategoryArtwork ? null : ownPhotoSrc(product, media?.src);
  const src =
    ownSrc && failedSrc !== ownSrc
      ? ownSrc
      : failedSrc === categorySrc
        ? null
        : categorySrc;

  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    const probe = new Image();
    probe.onerror = () => {
      if (!cancelled) setFailedSrc(src);
    };
    probe.src = src;
    return () => {
      cancelled = true;
      probe.onload = null;
      probe.onerror = null;
    };
  }, [src]);

  const label = locale === "fa" ? (media?.alt || product.name) : (media?.enAlt || product.en.name);

  if (!src) {
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
      <img className="product-photo" src={src} alt={label} />
      {soldBadge}
    </>
  );
}
