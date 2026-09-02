import { useMemo } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { useCatalog } from "@/components/catalog-provider";
import type { Product } from "@/lib/products";

export function useCartProducts() {
  const { slugs } = useCart();
  const { getProduct } = useCatalog();
  return useMemo(
    () =>
      slugs
        .map((slug) => getProduct(slug))
        .filter((item): item is Product => Boolean(item)),
    [slugs, getProduct],
  );
}
