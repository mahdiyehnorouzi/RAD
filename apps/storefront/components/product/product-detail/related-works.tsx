"use client";
import type { Product } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { ProductCarousel } from "../listing";
import { pdpCopy } from "./const";

export function RelatedWorks({ works }: { works: Product[] }) {
  const { locale } = useLocale();
  const c = pdpCopy[locale];

  if (works.length === 0) return null;

  return (
    <section className="pdp-related" aria-labelledby="pdp-related-title">
      <h2 id="pdp-related-title">{c.similarTitle}</h2>
      <ProductCarousel products={works} label={c.similarTitle} />
    </section>
  );
}
