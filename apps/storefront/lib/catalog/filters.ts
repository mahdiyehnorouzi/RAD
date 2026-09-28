import { artworkCategories } from "@/lib/catalog/artwork";

export const STATUS_FILTERS = ["all", "available", "upcoming", "sold"] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

export const CATALOG_SORTS = [
  "newest",
  "oldest",
  "price-asc",
  "price-desc",
] as const;
export type CatalogSort = (typeof CATALOG_SORTS)[number];

/**
 * Shop state as it appears in
 * `/products?q=&category=&status=&artist=&min=&max=&sort=`.
 * Prices are whole toman and both bounds are inclusive.
 */
export type CatalogFilters = {
  query: string;
  category: string;
  status: StatusFilter;
  /** `artistKey` of the vendor, or `all`. */
  artist: string;
  minPrice: number | null;
  maxPrice: number | null;
  sort: CatalogSort;
};

export const defaultCatalogFilters: CatalogFilters = {
  query: "",
  category: "all",
  status: "all",
  artist: "all",
  minPrice: null,
  maxPrice: null,
  sort: "newest",
};

type RawParams = Record<string, string | string[] | undefined>;

const ARTIST_KEY = /^[a-z0-9-]{1,64}$/;
const PRICE = /^\d{1,12}$/;

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function oneOf<T extends string>(list: readonly T[], value: string, fallback: T) {
  return (list as readonly string[]).includes(value) ? (value as T) : fallback;
}

function parsePrice(value: string) {
  if (!PRICE.test(value)) return null;
  const amount = Number(value);
  return amount > 0 ? amount : null;
}

export function parseCatalogFilters(params: RawParams): CatalogFilters {
  const category = first(params.category);
  const artist = first(params.artist).toLowerCase();
  let minPrice = parsePrice(first(params.min));
  let maxPrice = parsePrice(first(params.max));
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    [minPrice, maxPrice] = [maxPrice, minPrice];
  }
  return {
    query: first(params.q).slice(0, 80),
    category: artworkCategories.some((item) => item.id === category)
      ? category
      : "all",
    // `availability` is the pre-`status` name; old shared links keep working.
    status: oneOf(
      STATUS_FILTERS,
      first(params.status) || first(params.availability),
      "all",
    ),
    artist: ARTIST_KEY.test(artist) ? artist : "all",
    minPrice,
    maxPrice,
    sort: oneOf(CATALOG_SORTS, first(params.sort), "newest"),
  };
}

/** Writes filters into `search`, dropping defaults so clean URLs stay clean. */
export function applyCatalogFilters(
  search: URLSearchParams,
  filters: CatalogFilters,
) {
  const set = (key: string, value: string, fallback: string) => {
    if (value && value !== fallback) search.set(key, value);
    else search.delete(key);
  };
  set("q", filters.query.trim(), "");
  set("category", filters.category, "all");
  set("status", filters.status, "all");
  search.delete("availability");
  set("artist", filters.artist, "all");
  set("min", filters.minPrice ? String(filters.minPrice) : "", "");
  set("max", filters.maxPrice ? String(filters.maxPrice) : "", "");
  set("sort", filters.sort, "newest");
  return search;
}

export function catalogHref(filters: CatalogFilters) {
  const search = applyCatalogFilters(new URLSearchParams(), filters).toString();
  return search ? `/products?${search}` : "/products";
}

/** Narrowing beyond the search box; sort only reorders and is not a refinement. */
export function hasRefinements(filters: CatalogFilters) {
  return (
    filters.category !== "all" ||
    filters.status !== "all" ||
    filters.artist !== "all" ||
    filters.minPrice !== null ||
    filters.maxPrice !== null
  );
}
