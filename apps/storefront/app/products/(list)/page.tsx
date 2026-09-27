import { CatalogPage } from "@/components/catalog";
import { loadCatalogWorks } from "@/lib/catalog/get-catalog-works";
import { parseCatalogFilters } from "@/lib/catalog/filters";
import { productListJsonLd, safeJsonLd } from "@/lib/seo";

export default async function Products({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ products, live }, params] = await Promise.all([loadCatalogWorks(), searchParams]);
  const filters = parseCatalogFilters(params);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(productListJsonLd(products, "/products")),
        }}
      />
      <CatalogPage
        key={`${filters.query}|${filters.category}|${filters.availability}`}
        products={products}
        live={live}
        filters={filters}
      />
    </>
  );
}
