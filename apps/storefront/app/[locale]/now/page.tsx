import { NowIndex } from "@/components/now";
import { getCatalog, traceCatalogCall } from "@/lib/catalog/get-catalog-works";
import { livePiecesFrom } from "@/lib/now";

export default async function NowPage() {
  // TEMP DIAGNOSTIC — remove after identifying catalog-fetch caller distribution
  traceCatalogCall("now");
  const { artworks } = await getCatalog();
  return <NowIndex livePieces={livePiecesFrom(artworks)} />;
}
