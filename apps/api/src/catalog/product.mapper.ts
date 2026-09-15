import type { Prisma, Product, ProductImage, Vendor } from "@prisma/client";

/** Public product payloads only need image metadata — never load base64 `src`. */
export const productImageSelect = {
  id: true,
  alt: true,
  enAlt: true,
  color: true,
  accent: true,
  shape: true,
  sortOrder: true,
} satisfies Prisma.ProductImageSelect;

type ProductImageMeta = Pick<
  ProductImage,
  "id" | "alt" | "enAlt" | "color" | "accent" | "shape" | "sortOrder"
> & { src?: string | null };

function imageSrc(image: ProductImageMeta, embedImages: boolean) {
  if (embedImages) return image.src ?? undefined;
  return `/catalog/images/${image.id}`;
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

type ProductRecord = Product & {
  images: ProductImageMeta[];
  vendor: Vendor | null;
};

type EnCopy = { name: string; subtitle: string; story: string; details: string[] };

function asStringArray(value: Prisma.JsonValue): string[] {
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

function asEnCopy(value: Prisma.JsonValue, fallback: EnCopy): EnCopy {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    return {
      name: String(record.name ?? fallback.name),
      subtitle: String(record.subtitle ?? fallback.subtitle),
      story: String(record.story ?? fallback.story),
      details: Array.isArray(record.details) ? record.details.map(String) : fallback.details,
    };
  }
  if (typeof value === "string") {
    try {
      return asEnCopy(JSON.parse(value) as Prisma.JsonValue, fallback);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export function toProduct(product: ProductRecord, options?: { embedImages?: boolean }) {
  const embedImages = options?.embedImages ?? false;
  const details = asStringArray(product.details);
  return {
    slug: product.slug,
    name: product.name,
    subtitle: product.subtitle,
    price: formatToman(product.tomanPrice),
    usdPrice: product.usdPrice,
    color: product.color,
    accent: product.accent,
    shape: product.shape,
    category: product.category,
    visual: visualForCategory(product.category),
    status: product.status,
    story: product.story,
    details,
    images: product.images
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((image) => ({
        src: imageSrc(image, embedImages),
        alt: image.alt,
        enAlt: image.enAlt,
        color: image.color ?? undefined,
        accent: image.accent ?? undefined,
        shape: image.shape ?? undefined,
      })),
    artworkNumber: `RAD-${String(product.sortOrder + 27).padStart(3, "0")}`,
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

export const productInclude = {
  images: { select: productImageSelect },
  vendor: true,
} as const;

/** Admin edit forms need the stored data-URL `src` values. */
export const productIncludeWithSrc = {
  images: true,
  vendor: true,
} as const;

export const publicProductWhere = {
  status: { notIn: ["draft", "review"] as string[] },
};
