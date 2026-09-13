import { CatalogPage } from "@/components/catalog";
import { getCatalogWorks } from "@/lib/catalog/get-catalog-works";
import { productListJsonLd, safeJsonLd } from "@/lib/seo";

export default async function Products() {
  const products = await getCatalogWorks();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(productListJsonLd(products, "/products")),
        }}
      />
      <CatalogPage products={products} />
    </>
  );
}
