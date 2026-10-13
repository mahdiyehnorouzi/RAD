"use client";
import Link from "next/link";
import type { Product } from "@rad/types";
import { FavoriteButton } from "@/components/commerce";
import { useOpenProductTransition } from "@/features/product-detail";
import { LinkPending } from "../link-pending";
import type { ProductBadgeTone, ProductCardSlide } from "../type";
import { ProductCardArtwork } from "./product-card-artwork";
import { ProductCardBadge } from "./product-card-badge";

/** The photograph with the maker's pencilled number, the heart and one status badge. */
export function ProductCardStage({
  product,
  productHref,
  slide,
  markDigits,
  badge,
  forceCategoryArtwork,
}: {
  product: Product;
  productHref: string;
  slide?: ProductCardSlide;
  markDigits: string;
  badge: { tone: ProductBadgeTone; label: string } | null;
  forceCategoryArtwork: boolean;
}) {
  // Apple Store-style PDP entry: expand this exact card's photograph into
  // the fullscreen PDP overlay (see features/product-detail/transition).
  const { ref, onClick } = useOpenProductTransition(product.slug, productHref);

  return (
    <div className="rad-card-stage">
      <Link
        href={productHref}
        ref={ref}
        className="rad-card-art"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClick}
      >
        <ProductCardArtwork
          product={product}
          slide={slide}
          forceCategoryArtwork={forceCategoryArtwork}
        />
        <LinkPending />
      </Link>
      {markDigits ? (
        <span className="rad-card-mark" aria-hidden="true">
          <b>{markDigits}</b>
          <svg viewBox="0 0 64 8" focusable="false">
            <path d="M2 5.6c8.6-2.8 18.4-3.5 28.6-2.5 9.6.9 19.2 1.1 31.4-1.9" />
          </svg>
          <small>RĀD</small>
        </span>
      ) : null}
      <div className="rad-card-flags">
        <FavoriteButton slug={product.slug} compact />
        {badge ? (
          <ProductCardBadge tone={badge.tone} label={badge.label} />
        ) : null}
      </div>
    </div>
  );
}
