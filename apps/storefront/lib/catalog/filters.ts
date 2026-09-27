import { artworkCategories } from "@/lib/catalog/artwork";

export const AVAILABILITY_FILTERS = [
  "all",
  "available",
  "upcoming",
  "sold",
] as const;
export type AvailabilityFilter = (typeof AVAILABILITY_FILTERS)[number];

/** Shop filters as they appear in `/products?q=&category=&availability=`. */
export type CatalogFilters = {
  query: string;
  category: string;
  availability: AvailabilityFilter;
};

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export function parseCatalogFilters(params: RawParams): CatalogFilters {
  const category = first(params.category);
  const availability = first(params.availability);
  return {
    query: first(params.q).slice(0, 80),
    category: artworkCategories.some((item) => item.id === category)
      ? category
      : "all",
    availability: (AVAILABILITY_FILTERS as readonly string[]).includes(
      availability,
    )
      ? (availability as AvailabilityFilter)
      : "all",
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
  set("availability", filters.availability, "all");
  return search;
}
