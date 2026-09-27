import { useMemo } from "react";
import { useCatalog } from "@/components/catalog/catalog-provider";
import { useLocale } from "@/components/i18n";
import { normalizeQuery, productMatchesQuery } from "@/lib/catalog/search";

export function useSearchWorks(query: string) {
  const { locale } = useLocale();
  const { products } = useCatalog();
  const normalizedQuery = normalizeQuery(query, locale);

  const results = useMemo(
    () =>
      normalizedQuery
        ? products.filter((product) =>
            productMatchesQuery(product, normalizedQuery, locale),
          )
        : [],
    [locale, normalizedQuery, products],
  );

  return { normalizedQuery, results };
}
