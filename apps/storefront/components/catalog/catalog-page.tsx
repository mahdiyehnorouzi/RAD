import type { Product } from "@rad/types";
import { Catalog } from "./catalog";
import { CatalogIntro } from "./catalog-intro";
import { PageSection } from "@/components/ui/section";
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
  return (
    <PageSection className="plp">
      <Catalog
        products={products}
        live={live}
        initialFilters={filters}
        intro={<CatalogIntro key="catalog-intro" />}
      />
    </PageSection>
  );
}
