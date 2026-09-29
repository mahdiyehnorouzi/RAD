import type { Metadata } from "next";
import { CatalogPage } from "@/components/catalog";
import { loadCatalogWorks } from "@/lib/catalog/get-catalog-works";
import { catalogMetadata } from "@/lib/catalog/catalog-metadata";
import { catalogHref, parseCatalogFilters } from "@/lib/catalog/filters";
import {
  refineCatalog,
  resolveCatalogFilters,
  shopFloor,
} from "@/lib/catalog/refine";
import { productListJsonLd, safeJsonLd } from "@/lib/seo";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function loadCatalogView(searchParams: Props["searchParams"]) {
  const [{ products, live }, params] = await Promise.all([
    loadCatalogWorks(),
    searchParams,
  ]);
  const filters = resolveCatalogFilters(parseCatalogFilters(params), products);
  return { products, live, filters };
}

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const { products, filters } = await loadCatalogView(searchParams);
  return catalogMetadata(filters, products);
}

export default async function Products({ searchParams }: Props) {
  const { products, live, filters } = await loadCatalogView(searchParams);
  const href = catalogHref(filters);
  const listed = refineCatalog(shopFloor(products), filters, "fa");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(productListJsonLd(listed, href)),
        }}
      />
      <CatalogPage
        key={href}
        products={products}
        live={live}
        filters={filters}
      />
    </>
  );
}
