import { formatRadCode, type Product } from "@rad/types";
import type { MetadataRoute } from "next";
import { isReserved } from "@/lib/catalog/product-status";
import { formatToman } from "@/lib/money";

/** schema.org `ItemAvailability` values Google accepts on a product offer. */
export type SchemaAvailability =
  | "InStock"
  | "Reserved"
  | "PreOrder"
  | "SoldOut"
  | "Discontinued"
  | "OutOfStock";

/**
 * How a work faces search engines. Every work is one of one, so a sale ends
 * its commerce life but not its page:
 *
 * - `sold` keeps an indexed product page marked `SoldOut`; it still earns
 *   search traffic and links, and points to the passport and the studio.
 * - `archived` hands off to the passport: the product page stays reachable
 *   but is `noindex, follow` and leaves the sitemap.
 * - `reserved` is a short cart hold, so it stays indexed like `available`.
 */
type ProductSeoState =
  "available" | "reserved" | "upcoming" | "sold" | "archived" | "unlisted";

type ProductSeoStrategy = {
  availability: SchemaAvailability;
  index: boolean;
  /** Appended to the title in parentheses. */
  titleNote?: string;
  /** `null` keeps the page out of the sitemap. */
  sitemap: Pick<
    MetadataRoute.Sitemap[number],
    "priority" | "changeFrequency"
  > | null;
};

export const PRODUCT_SEO: Record<ProductSeoState, ProductSeoStrategy> = {
  available: {
    availability: "InStock",
    index: true,
    sitemap: { priority: 0.8, changeFrequency: "daily" },
  },
  reserved: {
    availability: "Reserved",
    index: true,
    sitemap: { priority: 0.8, changeFrequency: "daily" },
  },
  upcoming: {
    availability: "PreOrder",
    index: true,
    titleNote: "به‌زودی",
    sitemap: { priority: 0.7, changeFrequency: "weekly" },
  },
  sold: {
    availability: "SoldOut",
    index: true,
    titleNote: "فروخته شد",
    sitemap: { priority: 0.4, changeFrequency: "yearly" },
  },
  archived: {
    availability: "Discontinued",
    index: false,
    titleNote: "آرشیو",
    sitemap: null,
  },
  unlisted: {
    availability: "OutOfStock",
    index: true,
    sitemap: { priority: 0.6, changeFrequency: "weekly" },
  },
};

export function productSeoState(
  product: Pick<Product, "status" | "reservedUntil">,
  now = Date.now(),
): ProductSeoState {
  if (isReserved(product, now)) return "reserved";
  switch (product.status) {
    case "available":
      return "available";
    case "in_workshop":
    case "ready":
      return "upcoming";
    case "sold":
      return "sold";
    case "archived":
      return "archived";
    default:
      return "unlisted";
  }
}

/** `RĀD / 027`; Latin digits so titles match what people type. */
function radLabel(radNumber?: number) {
  return radNumber ? `RĀD / ${formatRadCode(radNumber)}` : null;
}

export function productSeoTitle(product: Product, state: ProductSeoState) {
  const code = radLabel(product.radNumber);
  const note = PRODUCT_SEO[state].titleNote;
  return (
    [code, product.name].filter(Boolean).join(" — ") +
    (note ? ` (${note})` : "")
  );
}

function clip(text: string, max: number) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s،؛.,:]+$/, "")}…`;
}

export function productSeoDescription(
  product: Product,
  state: ProductSeoState,
  priceToman: number,
) {
  const price = priceToman > 0 ? formatToman(priceToman) : null;
  const status = {
    available: price ? `اثر یگانه، ${price}` : "اثر یگانه",
    reserved: price ? `اثر یگانه، ${price}` : "اثر یگانه",
    upcoming: "به‌زودی در فروشگاه رَد",
    sold: "فروخته شد؛ گذرنامه‌اش در آرشیو رَد می‌ماند",
    archived: "در آرشیو رَد",
    unlisted: "اثر یگانه",
  }[state];
  return clip(`${product.subtitle}. ${status}. ${product.story}`, 160);
}
