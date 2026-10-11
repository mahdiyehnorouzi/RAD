import { DifferencesPage } from "@/components/difference";
import { getCatalog } from "@/lib/catalog/get-catalog-works";
import { portraitsFrom } from "@/lib/difference";

export default async function DifferencesMuseum() {
  const { artworks } = await getCatalog();
  return <DifferencesPage portraits={portraitsFrom(artworks)} />;
}
