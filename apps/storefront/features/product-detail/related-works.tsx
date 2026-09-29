"use client";
import type { Product } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { ProductCarousel } from "@/components/product/listing";
import { pdpCopy } from "./const";
import styles from "./related-works.module.css";

export function RelatedWorks({ works }: { works: Product[] }) {
  const { locale } = useLocale();
  const c = pdpCopy[locale];

  if (works.length === 0) return null;

  return (
    <section className={styles.related} aria-labelledby="pdp-related-title">
      <h2 id="pdp-related-title">{c.similarTitle}</h2>
      <ProductCarousel products={works} label={c.similarTitle} />
    </section>
  );
}
