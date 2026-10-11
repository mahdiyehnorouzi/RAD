import { NowIndex } from "@/components/now";
import { getCatalog } from "@/lib/catalog/get-catalog-works";
import { livePiecesFrom } from "@/lib/now";

export default async function NowPage() {
  const { artworks } = await getCatalog();
  return <NowIndex livePieces={livePiecesFrom(artworks)} />;
}
