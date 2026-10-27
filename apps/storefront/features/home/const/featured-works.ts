import type { Product } from "@rad/types";
import { isPurchasableStatus } from "@rad/types";
import { newestFirst } from "@/lib/catalog/refine";

/** One wide featured plate beside a card, then a full row of three. */
const FEATURED_LIMIT = 5;

/**
 * Homepage "Latest Works": the most recently listed purchasable works, newest
 * first. Only `available` works are eligible — sold/reserved/archived/draft
 * works never appear here, and missing slots are never padded with
 * ineligible or static fallback products; fewer than 5 eligible works just
 * means fewer than 5 cards.
 */
export function featuredHomeWorks(products: Product[]): Product[] {
  return products
    .filter((product) => isPurchasableStatus(product.status))
    .sort(newestFirst)
    .slice(0, FEATURED_LIMIT);
}
