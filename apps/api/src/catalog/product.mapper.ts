import type { ProductImage } from "../database/entities";
import { HIDDEN_PRODUCT_STATUSES } from "../inventory/const/product-status";
import { normalizeProductStatus } from "../inventory/product-status";
import { formatArtworkNumber } from "./rad-number";
import type {
  CatalogImage,
  EnCopy,
  ProductImageMeta,
  ProductRecord,
} from "./type";

/** Public product payloads only need image metadata — never load base64 `src`. */
export const productImageSelect: (keyof ProductImage)[] = [
  "id",
  "alt",
  "enAlt",
  "color",
  "accent",
  "shape",
  "sortOrder",
  "storage",
  "objectKey",
];

/**
 * `static` and `external` rows hold a real, directly-usable path/URL in
 * `src` — return it as-is. Only `legacy_base64` masks the row behind
 * `/catalog/images/:id` (that route decodes the data URI and streams
 * bytes). `cloudinary` rows derive their URL from `objectKey` (the
 * Cloudinary public_id) below.
 */
/**
 * Cloudinary delivery URL for a `cloudinary`-storage row, derived from the
 * public_id (`objectKey`, the durable source of truth persisted in the
 * DB) plus `CLOUDINARY_CLOUD_NAME` config — never persisted itself, so
 * renaming the cloud or moving assets around only ever requires updating
 * config, not every row.
 *
 * `f_auto,q_auto` is baked in here (Cloudinary's own format/quality
 * auto-negotiation) so every consumer gets a reasonably optimized asset by
 * default even without going through `next/image`. `apps/storefront`'s
 * `ProductMedia` component additionally applies a width (`w_<width>`) on
 * top of this exact transformation segment via a custom `next/image`
 * loader scoped to Cloudinary URLs — see `product-media.tsx` — so the
 * existing per-context `sizes` logic (PLP vs PDP vs cart/checkout) still
 * drives how large an image Cloudinary actually serves, without also
 * paying for Cloudflare's Workers-level image resizing on top of it. Keep
 * this transformation segment's exact text (`f_auto,q_auto`) in sync with
 * that loader's string replace.
 */
function cloudinaryDeliveryUrl(objectKey: string, video = false) {
  const cloudName = (process.env.CLOUDINARY_CLOUD_NAME ?? "").trim();
  if (!cloudName) {
    // Not configured — fall back to the legacy proxy route so the app
    // doesn't crash; the image simply won't resolve until
    // CLOUDINARY_CLOUD_NAME is set (see apps/api/.env.example).
    return undefined;
  }
  return `https://res.cloudinary.com/${cloudName}/${video ? "video" : "image"}/upload/${objectKey}`;
}

/**
 * Delivery URL for a `seaweedfs`/`seaweedfs_video` row, derived from
 * `objectKey` (the S3 key, durable source of truth) plus
 * `SEAWEEDFS_PUBLIC_URL` (or, when unset, `SEAWEEDFS_ENDPOINT` +
 * `SEAWEEDFS_BUCKET`) — never persisted itself, same rationale as
 * `cloudinaryDeliveryUrl` above. Unlike Cloudinary, there is no
 * on-the-fly transform API, so this is always the full-size asset.
 */
function seaweedfsDeliveryUrl(objectKey: string) {
  const base = (process.env.SEAWEEDFS_PUBLIC_URL ?? "").trim();
  const endpoint = (process.env.SEAWEEDFS_ENDPOINT ?? "").trim();
  const bucket = (process.env.SEAWEEDFS_BUCKET ?? "").trim();
  const baseUrl = base || (endpoint && bucket ? `${endpoint}/${bucket}` : "");
  if (!baseUrl) return undefined;
  return `${baseUrl.replace(/\/+$/, "")}/${objectKey}`;
}

export function imageSrc(image: ProductImageMeta, embedImages: boolean) {
  if (embedImages) return image.src ?? undefined;
  switch (image.storage) {
    case "static":
    case "external":
      return image.src ?? `/catalog/images/${image.id}`;
    case "cloudinary_video":
    case "cloudinary":
      return (
        (image.objectKey
          ? cloudinaryDeliveryUrl(
              image.objectKey,
              image.storage === "cloudinary_video",
            )
          : undefined) ?? `/catalog/images/${image.id}`
      );
    case "seaweedfs_video":
    case "seaweedfs":
      return (
        (image.objectKey ? seaweedfsDeliveryUrl(image.objectKey) : undefined) ??
        `/catalog/images/${image.id}`
      );
    case "legacy_base64":
    default:
      // `default` also covers rows from before the Phase 0 backfill ran.
      return `/catalog/images/${image.id}`;
  }
}

export function toCatalogImages(
  images: ProductImageMeta[],
  embedImages = false,
  includeVideos = false,
): CatalogImage[] {
  const isVideo = (storage: ProductImageMeta["storage"]) =>
    storage === "cloudinary_video" || storage === "seaweedfs_video";
  return [...images]
    .filter((image) => includeVideos || !isVideo(image.storage))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((image) => ({
      src: imageSrc(image, embedImages),
      kind: isVideo(image.storage) ? ("video" as const) : ("image" as const),
      thumbnail:
        image.objectKey &&
        (image.storage === "cloudinary" || image.storage === "cloudinary_video")
          ? `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/${image.storage === "cloudinary_video" ? "video" : "image"}/upload/c_limit,w_320/${image.objectKey}.jpg`
          : // SeaweedFS has no on-the-fly transform API — fall back to the full asset.
            image.objectKey &&
              (image.storage === "seaweedfs" ||
                image.storage === "seaweedfs_video")
            ? seaweedfsDeliveryUrl(image.objectKey)
            : undefined,
      alt: image.alt,
      enAlt: image.enAlt,
      color: image.color ?? undefined,
      accent: image.accent ?? undefined,
      shape: image.shape ?? undefined,
    }));
}

function visualForCategory(category: string) {
  if (category === "painting") return "painting";
  if (category === "textile") return "textile";
  if (category === "woodwork") return "wood";
  if (category === "jewelry") return "jewelry";
  if (category === "print") return "print";
  if (category === "sculpture") return "sculpture";
  return "vessel";
}

const persianDigits = "۰۱۲۳۴۵۶۷۸۹";

function toPersianDigits(value: string) {
  return value.replace(/\d/g, (digit) => persianDigits[Number(digit)] ?? digit);
}

export function formatToman(value: number) {
  return `${toPersianDigits(new Intl.NumberFormat("en-US").format(value).replace(/,/g, "٬"))} تومان`;
}

export function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function asEnCopy(value: unknown, fallback: EnCopy): EnCopy {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    return {
      name: String(record.name ?? fallback.name),
      subtitle: String(record.subtitle ?? fallback.subtitle),
      story: String(record.story ?? fallback.story),
      details: Array.isArray(record.details)
        ? record.details.map(String)
        : fallback.details,
    };
  }
  if (typeof value === "string") {
    try {
      return asEnCopy(JSON.parse(value) as unknown, fallback);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export function toProduct(
  product: ProductRecord,
  options?: {
    embedImages?: boolean;
    attributes?: { key: string; label: string; value: string }[];
  },
) {
  const embedImages = options?.embedImages ?? false;
  const details = asStringArray(product.details);
  const status = normalizeProductStatus(product.status);
  return {
    slug: product.slug,
    name: product.name,
    subtitle: product.subtitle,
    price: product.tomanPrice === null ? "" : formatToman(product.tomanPrice),
    usdPrice: product.usdPrice ?? 0,
    color: product.color,
    accent: product.accent,
    shape: product.shape,
    category: product.category,
    visual: visualForCategory(product.category),
    status,
    // Held in someone's bag or unpaid checkout: may return to the shop. Never exposes who holds it.
    reservedUntil:
      status === "sold" && product.holdExpiresAt
        ? product.holdExpiresAt.getTime()
        : undefined,
    story: product.story,
    details,
    images: toCatalogImages(product.images, embedImages),
    media: toCatalogImages(product.images, embedImages, true),
    radNumber: product.radNumber ?? undefined,
    artworkNumber: product.radNumber
      ? formatArtworkNumber(product.radNumber)
      : undefined,
    listedAt: product.createdAt.getTime(),
    vendor: product.vendor
      ? {
          id: product.vendor.id,
          displayName: product.vendor.displayName,
          displayNameEn: product.vendor.displayNameEn,
          kind: product.vendor.kind,
          verified: product.vendor.verified,
        }
      : undefined,
    en: asEnCopy(product.en, {
      name: product.name,
      subtitle: product.subtitle,
      story: product.story,
      details,
    }),
    attributes: options?.attributes ?? [],
  };
}

/** Admin edit forms need the stored data-URL `src` values. */
export const productIncludeWithSrc = {
  images: true,
  vendor: true,
} as const;

export const publicProductWhere = {
  status: { notIn: [...HIDDEN_PRODUCT_STATUSES] as string[] },
};

export function stripImageSrc(images: ProductImage[]): ProductImageMeta[] {
  return images.map(
    ({
      id,
      alt,
      enAlt,
      color,
      accent,
      shape,
      sortOrder,
      storage,
      src,
      objectKey,
    }) => ({
      id,
      alt,
      enAlt,
      color,
      accent,
      shape,
      sortOrder,
      storage,
      objectKey,
      // Only keep `src` for the formats the public mapper actually returns
      // as-is (`static`/`external`); never carry the base64 payload past
      // this point for `legacy_base64` rows, and `cloudinary` rows never
      // have a `src` to begin with (see `replaceImages`).
      src: storage === "legacy_base64" ? null : src,
    }),
  );
}
