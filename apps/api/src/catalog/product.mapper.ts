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
];

function imageSrc(image: ProductImageMeta, embedImages: boolean) {
  if (embedImages) return image.src ?? undefined;
  return `/catalog/images/${image.id}`;
}

export function toCatalogImages(
  images: ProductImageMeta[],
  embedImages = false,
): CatalogImage[] {
  return [...images]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((image) => ({
      src: imageSrc(image, embedImages),
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
  options?: { embedImages?: boolean },
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
  return images.map(({ id, alt, enAlt, color, accent, shape, sortOrder }) => ({
    id,
    alt,
    enAlt,
    color,
    accent,
    shape,
    sortOrder,
  }));
}
