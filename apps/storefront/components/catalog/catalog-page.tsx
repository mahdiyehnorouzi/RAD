"use client";

import type { Product } from "@rad/types";
import { Catalog } from "./catalog";
import { Eyebrow, PageSection } from "@/components/ui/section";
import { useLocale } from "@/components/i18n";
import type { CatalogFilters } from "@/lib/catalog/filters";

export function CatalogPage({
  products,
  live,
  filters,
}: {
  products: Product[];
  live: boolean;
  filters: CatalogFilters;
}) {
  const { t } = useLocale();
  return (
    <PageSection className="plp">
      <header className="mb-4">
        <Eyebrow>{t("shopEyebrow")}</Eyebrow>
        <h1 className="m-0 text-h2 font-normal">{t("shopTitle")}</h1>
        <p className="mt-3 max-w-2xl text-prose">{t("shopBody")}</p>
      </header>
      <Catalog products={products} seededLive={live} initialFilters={filters} />
    </PageSection>
  );
}
