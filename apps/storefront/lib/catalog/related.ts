import type { Product } from "@rad/types";
import { isGoneStatus } from "./product-status";

/** Up to four other works: those still on sale lead; within each group, same category first. */
export function relatedWorks(current: Product, products: Product[]): Product[] {
  const rank = (item: Product) =>
    (isGoneStatus(item.status) ? 2 : 0) +
    (item.category === current.category ? 0 : 1);
  return products
    .filter((item) => item.slug !== current.slug)
    .map((item, index) => ({ item, index }))
    .sort((a, b) => rank(a.item) - rank(b.item) || a.index - b.index)
    .map(({ item }) => item)
    .slice(0, 4);
}
