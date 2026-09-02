import { useMemo } from "react";
import { productCopy } from "@/lib/products";
import { useCatalog } from "@/components/catalog-provider";
import { useLocale } from "@/components/i18n";

export function useSearchWorks(query: string) {
  const { locale } = useLocale();
  const { products } = useCatalog();
  const normalizedQuery = query.trim().toLocaleLowerCase(locale);

  const results = useMemo(
    () =>
      normalizedQuery
        ? products.filter((product) => {
            const copy = productCopy(product, locale);
            return `${copy.name} ${copy.subtitle} ${copy.story}`
              .toLocaleLowerCase(locale)
              .includes(normalizedQuery);
          })
        : [],
    [locale, normalizedQuery, products],
  );

  return { normalizedQuery, results };
}
