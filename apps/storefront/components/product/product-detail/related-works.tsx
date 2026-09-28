"use client";
import { useMemo } from "react";
import type { Product } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { isGoneStatus } from "@/lib/catalog/product-status";
import { ProductCarousel, ProductGridSkeleton } from "../listing";
import { pdpCopy } from "./const";

/** Works still on sale lead; within each group, same category first. */
export function RelatedWorks({
  current,
  products,
  loading,
}: {
  current: Product;
  products: Product[];
  loading: boolean;
}) {
  const { locale } = useLocale();
  const c = pdpCopy[locale];
  const works = useMemo(() => {
    const rank = (item: Product) =>
      (isGoneStatus(item.status) ? 2 : 0) +
      (item.category === current.category ? 0 : 1);
    return products
      .filter((item) => item.slug !== current.slug)
      .map((item, index) => ({ item, index }))
      .sort((a, b) => rank(a.item) - rank(b.item) || a.index - b.index)
      .map(({ item }) => item)
      .slice(0, 4);
  }, [products, current.slug, current.category]);

  if (!loading && works.length === 0) return null;

  return (
    <section className="pdp-related" aria-labelledby="pdp-related-title">
      <h2 id="pdp-related-title">{c.similarTitle}</h2>
      {works.length === 0 ? (
        <ProductGridSkeleton count={4} className="pdp-related-track" />
      ) : (
        <ProductCarousel products={works} label={c.similarTitle} />
      )}
    </section>
  );
}
