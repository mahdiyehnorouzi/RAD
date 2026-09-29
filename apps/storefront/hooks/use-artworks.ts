import { useMemo } from "react";
import { useCatalog } from "@/components/catalog/catalog-provider";
import { passportsFrom } from "@/lib/passport";

/** Passport view of the artworks the route's `CatalogScope` passed down. */
export function usePassports() {
  const { artworks } = useCatalog();
  return useMemo(() => passportsFrom(artworks), [artworks]);
}
