"use client";

import type { CSSProperties } from "react";
import type { Product } from "@rad/types";
import { hasRealProductImage } from "@/lib/catalog/category-defaults";
import { cardMediaStyle } from "./const";
import { ProductMedia } from "./product-media";

export function ProductCardArtwork({
  product,
  artworkNumber,
  edition,
  forceCategoryArtwork = false,
}: {
  product: Product;
  artworkNumber: string;
  edition: string;
  forceCategoryArtwork?: boolean;
}) {
  const hasPhoto = !forceCategoryArtwork && hasRealProductImage(product);
  const shape = product.shape ?? "round";
  const style = cardMediaStyle(product.slug, {
    "--card-art-color": product.color ?? "var(--sand)",
    "--card-art-accent": product.accent ?? "var(--paper)",
  } as CSSProperties);

  return (
    <span
      className={`product-card-artwork product-card-artwork--${shape}`}
      style={style}
    >
      {!hasPhoto ? (
        <span className="product-art-backdrop" aria-hidden="true">
          <ProductMedia
            product={product}
            forceCategoryArtwork={forceCategoryArtwork}
            showStatusBadge={false}
          />
        </span>
      ) : null}
      <span className={`product-artwork-cutout${hasPhoto ? " has-photo" : ""}`}>
        <ProductMedia
          product={product}
          forceCategoryArtwork={forceCategoryArtwork}
          showStatusBadge={false}
        />
      </span>
      <span className="product-polaroid-marks">
        <span className="edition">{edition}</span>
        {artworkNumber ? (
          <small className="product-index">{artworkNumber}</small>
        ) : null}
      </span>
    </span>
  );
}
