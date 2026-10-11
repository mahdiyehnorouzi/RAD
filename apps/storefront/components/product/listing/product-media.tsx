"use client";
import { useState } from "react";
import Image, { type ImageLoaderProps } from "next/image";
import type { Product } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { artworkVisual, artworkCategoryById } from "@/lib/catalog/artwork";
import {
  isFileProductImage,
  productPhotoSrc,
} from "@/lib/catalog/category-defaults";
import { hasStudioPhotos, lifestylePhotoSrc } from "@/lib/catalog/photo-works";
import { ArtworkVisual } from "../artwork-visual";
import { useProductStatus } from "@/hooks/use-product-status";
import "./product-media.css";

function ownPhotoSrc(
  product: Product,
  src?: string,
  preserveTransparentBackground = false,
) {
  // The API now returns the real static path for this image directly (no
  // more masking non-base64 images behind `/catalog/images/:id`), so the
  // transparent studio photo is just `src` — no need to reconstruct it from
  // the product slug. The lifestyle companion photo still has to be derived
  // (it isn't a separate entry in `product.images`), but that's done from
  // the real `src` now instead of the slug.
  if (src && hasStudioPhotos(product)) {
    return preserveTransparentBackground ? src : lifestylePhotoSrc(src);
  }
  if (isFileProductImage(src)) return productPhotoSrc(src);
  if (src) return null;
  return null;
}

/**
 * The API mirrors every Cloudinary delivery URL from `f_auto,q_auto/<public_id>`
 * (see `apps/api/src/catalog/product.mapper.ts#cloudinaryDeliveryUrl`) —
 * recognizing that exact shape here lets this component insert a
 * per-request width on top of it.
 */
const CLOUDINARY_URL_PATTERN =
  /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/f_auto,q_auto\//;

function isCloudinaryUrl(src: string) {
  return CLOUDINARY_URL_PATTERN.test(src);
}

/**
 * Decision (storefront performance pass, R2→Cloudinary swap): a
 * Cloudinary-hosted product photo should NOT also be re-optimized by
 * Cloudflare's Workers-level image optimizer (`vinext`'s `imagesOptimizer`,
 * configured in `vite.config.ts`/`wrangler.jsonc`) — that would be a
 * second, redundant resize/transcode pass over an asset Cloudinary can
 * already serve at the exact size/format needed via URL params, with no
 * real benefit (Cloudinary's own `f_auto,q_auto` already handles
 * format/quality negotiation).
 *
 * A `next/image` component with a custom `loader` bypasses the built-in
 * optimizer entirely for that one `<Image>` — Next calls the loader
 * directly instead of routing through the optimization endpoint — so no
 * change to `vite.config.ts`/`wrangler.jsonc` or `remotePatterns` is
 * needed; this is scoped per-image, only for `src` values that are
 * actually Cloudinary URLs. The loader still receives `width` from
 * `next/image`'s normal responsive-size negotiation (driven by the
 * `sizes` prop each call site already passes — PLP/PDP/cart/checkout —
 * from the earlier performance pass), so Cloudinary ends up doing exactly
 * the per-context responsive sizing that pass established, just via its
 * own `w_<width>` URL param instead of Cloudflare's resizer.
 */
function cloudinaryLoader({ src, width }: ImageLoaderProps) {
  return src.replace("f_auto,q_auto/", `f_auto,q_auto,w_${width}/`);
}

export function ProductMedia({
  product,
  imageIndex = 0,
  forceCategoryArtwork = false,
  showStatusBadge = true,
  preserveTransparentBackground = false,
  priority = false,
  sizes = "100vw",
}: {
  product: Product;
  imageIndex?: number;
  forceCategoryArtwork?: boolean;
  showStatusBadge?: boolean;
  preserveTransparentBackground?: boolean;
  /** The first image on screen: load it immediately instead of lazily. */
  priority?: boolean;
  /**
   * The `sizes` attribute for the responsive image, matching the actual
   * rendered width of this usage's container (PLP card, PDP gallery, cart
   * thumbnail, etc). Callers must pass a context-accurate value; the
   * default assumes a full-viewport-width image.
   */
  sizes?: string;
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
    : ownPhotoSrc(product, media?.src, preserveTransparentBackground);
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
      <Image
        className="product-photo"
        src={src}
        alt={label}
        fill
        sizes={sizes}
        priority={priority}
        loader={isCloudinaryUrl(src) ? cloudinaryLoader : undefined}
        onError={() => setFailedSrc(src)}
      />
      {soldBadge}
    </>
  );
}
