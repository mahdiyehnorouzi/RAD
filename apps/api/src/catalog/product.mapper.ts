import type { Prisma, Product, ProductImage, Vendor } from "@prisma/client";

const persianDigits = "۰۱۲۳۴۵۶۷۸۹";

function toPersianDigits(value: string) {
  return value.replace(/\d/g, (digit) => persianDigits[Number(digit)] ?? digit);
}

export function formatToman(value: number) {
  return `${toPersianDigits(new Intl.NumberFormat("en-US").format(value).replace(/,/g, "٬"))} تومان`;
}

type ProductRecord = Product & {
  images: ProductImage[];
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

export function toProduct(product: ProductRecord) {
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
    status: product.status,
    story: product.story,
    details,
    images: product.images
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((image) => ({
        src: image.src ?? undefined,
        alt: image.alt,
        enAlt: image.enAlt,
        color: image.color ?? undefined,
        accent: image.accent ?? undefined,
        shape: image.shape ?? undefined,
      })),
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
  images: true,
  vendor: true,
} as const;

export const publicProductWhere = {
  status: { notIn: ["draft", "review"] as string[] },
};
