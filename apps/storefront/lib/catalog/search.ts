import type { Locale, Product } from "@rad/types";
import { categoryLabel } from "@/lib/catalog/artwork";
import { productCopy } from "@/lib/catalog/products";

/** One header-search result, already in the visitor's language. */
export type SearchHit = { slug: string; name: string; subtitle: string };

export function normalizeQuery(query: string, locale: Locale) {
  return query.trim().toLocaleLowerCase(locale);
}

/** `normalized` must come from {@link normalizeQuery}. Empty matches everything. */
export function productMatchesQuery(
  product: Product,
  normalized: string,
  locale: Locale,
) {
  if (!normalized) return true;
  const copy = productCopy(product, locale);
  return `${copy.name} ${copy.subtitle} ${copy.story} ${categoryLabel(product.category, locale)}`
    .toLocaleLowerCase(locale)
    .includes(normalized);
}
