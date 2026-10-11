import { DifferencesPage } from "@/components/difference";
import { getCatalog, traceCatalogCall } from "@/lib/catalog/get-catalog-works";
import { portraitsFrom } from "@/lib/difference";

export default async function DifferencesMuseum() {
  // TEMP DIAGNOSTIC — remove after identifying catalog-fetch caller distribution
  traceCatalogCall("differences");
  const { artworks } = await getCatalog();
  return <DifferencesPage portraits={portraitsFrom(artworks)} />;
}
