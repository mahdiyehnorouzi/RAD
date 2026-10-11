import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCardShowcase } from "@/components/product";
import { getCatalog, traceCatalogCall } from "@/lib/catalog/get-catalog-works";

export const metadata: Metadata = {
  title: "Product cards",
  robots: { index: false, follow: false },
};

/** Development reference for every card variant and badge state. */
export default async function ProductCardsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  // TEMP DIAGNOSTIC — remove after identifying catalog-fetch caller distribution
  traceCatalogCall("design-cards");
  const { products } = await getCatalog();
  return <ProductCardShowcase products={products} />;
}
