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
 * `SEAWEEDFS_PUBLIC_URL`'s host, mirrored into the client bundle by
 * `next.config.mjs` (`env.NEXT_PUBLIC_SEAWEEDFS_HOST`), which also adds it to
 * `images.remotePatterns` when set. Unlike SeaweedFS, SeaweedFS has no
 * transform API of its own — but once its host is allowlisted, Next's own
 * built-in optimizer can still fetch-and-resize it server-side, so a known
 * SeaweedFS URL no longer needs a custom loader at all (`undefined` below
 * routes it through that default optimizer instead of `identityLoader`).
 */
function isKnownSeaweedfsUrl(src: string) {
  const host = process.env.NEXT_PUBLIC_SEAWEEDFS_HOST;
  if (!host) return false;
  try {
    return new URL(src).host === host;
  } catch {
    return false;
  }
}

/**
 * Any absolute URL from an unrecognized host that is not allowlisted in
 * `next.config.mjs`'s `images.remotePatterns`.
 *
 * A custom `loader` bypasses next/image's built-in optimizer (and the
 * domain allowlist check that comes with it) for the one `<Image>` it's
 * passed to, same as `seaweedfsLoader` already does — this just returns
 * the URL unchanged since there's no transform API to ask for a smaller
 * size from, and the host isn't allowlisted for Next's own optimizer to
 * fetch it either. This lets the UI scope the bypass to remote URLs: scope
 * the bypass to actual remote URLs, never to the on-site
 * `/catalog/images/:id` proxy route or a relative `static`/`external` path.
 */
function identityLoader({ src }: ImageLoaderProps) {
  return src;
}

function isAbsoluteHttpUrl(src: string) {
  return /^https?:\/\//.test(src);
}

export function ProductMedia({
  product,
  imageIndex = 0,
  forceCategoryArtwork = false,
  showStatusBadge = true,
  preserveTransparentBackground = false,
  priority = false,
  fetchPriority,
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
   * `next/image`'s `priority` only skips `loading="lazy"` and adds a
   * `<link rel=preload>` — it does NOT set the `fetchpriority` attribute on
   * either of those (see `next/dist/shared/lib/get-img-props.js`: `priority`
   * and `fetchPriority` are two separate, independently-passed props).
   * Without this, a `priority` image still competes at the browser's
   * default ("auto") priority against every other request on the page.
   * Callers must opt in explicitly and sparingly — at most one `"high"` per
   * page, for the actual LCP candidate — never derived automatically from
   * `priority` here, since `priority` alone is already used more broadly
   * (e.g. the first 2 PLP cards) than any one page should mark `"high"`.
   */
  fetchPriority?: "high" | "low" | "auto";
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
        fetchPriority={fetchPriority}
        loader={
          isAbsoluteHttpUrl(src) && !isKnownSeaweedfsUrl(src)
            ? identityLoader
            : undefined
        }
        onError={() => setFailedSrc(src)}
      />
      {soldBadge}
    </>
  );
}
