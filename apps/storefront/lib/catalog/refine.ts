import type { Locale, Product, Vendor } from "@rad/types";
import { priceToNumber } from "@/lib/money";
import type {
  CatalogFilters,
  CatalogSort,
  StatusFilter,
} from "@/lib/catalog/filters";
import { isShopStatus, isUpcomingStatus } from "@/lib/catalog/product-status";
import { normalizeQuery, productMatchesQuery } from "@/lib/catalog/search";

export type CatalogArtist = {
  key: string;
  name: { fa: string; en: string };
  count: number;
};

/**
 * URL key for an artist. Built from the English name so links read well and
 * stay the same whether the list came from the API or the offline registry.
 */
function artistKey(vendor: Pick<Vendor, "id" | "displayNameEn">) {
  const slug = vendor.displayNameEn
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return slug || vendor.id.toLowerCase().slice(0, 64);
}

/** Artists with at least one work in `products`, in first-seen order. */
export function catalogArtists(products: Product[]): CatalogArtist[] {
  const byKey = new Map<string, CatalogArtist>();
  for (const product of products) {
    if (!product.vendor) continue;
    const key = artistKey(product.vendor);
    const current = byKey.get(key);
    if (current) current.count += 1;
    else {
      byKey.set(key, {
        key,
        name: {
          fa: product.vendor.displayName,
          en: product.vendor.displayNameEn,
        },
        count: 1,
      });
    }
  }
  return [...byKey.values()];
}

export function shopFloor(products: Product[]) {
  return products.filter((product) => isShopStatus(product.status));
}

/** Drops an artist the collection does not know, so a stale link shows every work instead of none. */
export function resolveCatalogFilters(
  filters: CatalogFilters,
  products: Product[],
): CatalogFilters {
  if (filters.artist === "all") return filters;
  const known = products.some(
    (product) => product.vendor && artistKey(product.vendor) === filters.artist,
  );
  return known ? filters : { ...filters, artist: "all" };
}

function matchesStatus(product: Product, status: StatusFilter) {
  if (status === "all") return true;
  if (status === "upcoming") return isUpcomingStatus(product.status);
  return product.status === status;
}

function matchesPrice(product: Product, filters: CatalogFilters) {
  if (filters.minPrice === null && filters.maxPrice === null) return true;
  const amount = priceToNumber(product.price);
  if (!amount) return false;
  if (filters.minPrice !== null && amount < filters.minPrice) return false;
  if (filters.maxPrice !== null && amount > filters.maxPrice) return false;
  return true;
}

function newestFirst(a: Product, b: Product) {
  return (
    (b.listedAt ?? 0) - (a.listedAt ?? 0) ||
    (b.radNumber ?? 0) - (a.radNumber ?? 0)
  );
}

const comparators: Record<CatalogSort, (a: Product, b: Product) => number> = {
  newest: newestFirst,
  oldest: (a, b) => newestFirst(b, a),
  "price-asc": (a, b) =>
    priceToNumber(a.price) - priceToNumber(b.price) || newestFirst(a, b),
  "price-desc": (a, b) =>
    priceToNumber(b.price) - priceToNumber(a.price) || newestFirst(a, b),
};

/** Filters and orders shop-floor works exactly as `/products` shows them. */
export function refineCatalog(
  products: Product[],
  filters: CatalogFilters,
  locale: Locale,
) {
  const query = normalizeQuery(filters.query, locale);
  return products
    .filter(
      (product) =>
        (filters.category === "all" || product.category === filters.category) &&
        matchesStatus(product, filters.status) &&
        (filters.artist === "all" ||
          (product.vendor && artistKey(product.vendor) === filters.artist)) &&
        matchesPrice(product, filters) &&
        productMatchesQuery(product, query, locale),
    )
    .sort(comparators[filters.sort]);
}
