import { useMemo } from "react";
import { useCatalog } from "@/components/catalog/catalog-provider";
import { portraitsFrom } from "@/lib/difference";
import { livePiecesFrom } from "@/lib/now";
import { passportsFrom } from "@/lib/passport";

/** Passport view of the live artworks. */
export function usePassports() {
  const { artworks } = useCatalog();
  return useMemo(() => passportsFrom(artworks), [artworks]);
}

/** Difference-museum view of the live artworks. */
export function usePortraits() {
  const { artworks } = useCatalog();
  return useMemo(() => portraitsFrom(artworks), [artworks]);
}

/** Workshop journals joined with the live artworks. */
export function useLivePieces() {
  const { artworks } = useCatalog();
  return useMemo(() => livePiecesFrom(artworks), [artworks]);
}
