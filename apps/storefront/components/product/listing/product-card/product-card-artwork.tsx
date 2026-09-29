"use client";

import type { CSSProperties } from "react";
import type { Product } from "@rad/types";
import { hasRealProductImage } from "@/lib/catalog/category-defaults";
import { cardMediaStyle } from "../const";
import { ProductMedia } from "../product-media";
import type { ProductCardSlide } from "../type";

export function ProductCardArtwork({
  product,
  slide = { kind: "photo", index: 0 },
  forceCategoryArtwork = false,
}: {
  product: Product;
  slide?: ProductCardSlide;
  forceCategoryArtwork?: boolean;
}) {
  const plate = slide.kind === "plate";
  const imageIndex = slide.kind === "photo" ? slide.index : 0;
  const hasPhoto =
    !plate && !forceCategoryArtwork && hasRealProductImage(product);
  const shape = product.shape ?? "round";
  const style = cardMediaStyle(product.slug, {
    "--card-art-color": product.color ?? "var(--sand)",
    "--card-art-accent": product.accent ?? "var(--paper)",
  } as CSSProperties);

  return (
    <span
      className={`product-card-artwork product-card-artwork--${shape}${plate ? " is-plate" : ""}`}
      style={style}
    >
      {!hasPhoto ? (
        <span className="product-art-backdrop" aria-hidden="true">
          {plate ? null : (
            <ProductMedia
              product={product}
              imageIndex={imageIndex}
              forceCategoryArtwork={forceCategoryArtwork}
              showStatusBadge={false}
            />
          )}
        </span>
      ) : null}
      <span className={`product-artwork-cutout${hasPhoto ? " has-photo" : ""}`}>
        <ProductMedia
          product={product}
          imageIndex={imageIndex}
          forceCategoryArtwork={forceCategoryArtwork}
          showStatusBadge={false}
          preserveTransparentBackground={plate}
        />
      </span>
    </span>
  );
}
