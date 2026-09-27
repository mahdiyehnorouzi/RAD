import { normalizeProductStatus } from "../inventory/product-status";
import { asEnCopy, asStringArray, toCatalogImages } from "./product.mapper";
import type {
  ArtworkArtist,
  ArtworkMaterials,
  ArtworkResponse,
  LocalizedText,
  ProductRecord,
} from "./type";

const radStudio: ArtworkArtist = {
  id: "rad-studio",
  name: { fa: "استودیو رَد", en: "RAD Studio" },
  kind: "rad",
  verified: true,
};

function asLocalized(value: unknown): LocalizedText | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.fa !== "string" || typeof record.en !== "string")
    return null;
  return { fa: record.fa, en: record.en };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asMaterials(
  value: unknown,
  fallback: LocalizedText,
): ArtworkMaterials {
  const record = asRecord(value);
  return {
    body: asLocalized(record?.body) ?? fallback,
    surface: asLocalized(record?.surface),
    process: asLocalized(record?.process),
  };
}

export function toArtwork(product: ProductRecord): ArtworkResponse {
  const details = asStringArray(product.details);
  const en = asEnCopy(product.en, {
    name: product.name,
    subtitle: product.subtitle,
    story: product.story,
    details,
  });
  const status = normalizeProductStatus(product.status);
  const description = { fa: product.subtitle, en: en.subtitle };
  return {
    id: product.id,
    radNumber: product.radNumber,
    slug: product.slug,
    title: { fa: product.name, en: en.name },
    artist: product.vendor
      ? {
          id: product.vendor.id,
          name: {
            fa: product.vendor.displayName,
            en: product.vendor.displayNameEn,
          },
          kind: product.vendor.kind === "rad" ? "rad" : "guest_artist",
          verified: product.vendor.verified,
        }
      : radStudio,
    category: product.category,
    status,
    reservedUntil:
      status === "sold" && product.holdExpiresAt
        ? product.holdExpiresAt.getTime()
        : undefined,
    price: product.tomanPrice,
    currency: "IRT",
    usdPrice: product.usdPrice,
    year: product.year,
    materials: asMaterials(product.materials, description),
    dimensions: asLocalized(product.dimensions),
    description,
    story: { fa: product.story, en: en.story },
    care: asLocalized(product.care),
    images: toCatalogImages(product.images),
    color: product.color,
    accent: product.accent,
    shape: product.shape,
    passport: asRecord(product.passport),
    difference: asRecord(product.difference),
    owner: asLocalized(product.owner),
    createdAt: product.createdAt.getTime(),
    updatedAt: product.updatedAt.getTime(),
  };
}
