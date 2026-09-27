import type { Artwork, Product } from "@rad/types";
import { fallbackArtworks, loadArtworks, shopProducts } from "@/lib/artworks";

export const displayWorks: Product[] = shopProducts(fallbackArtworks);

export type CatalogLoad = {
  artworks: Artwork[];
  /** The shop projection of `artworks`. */
  products: Product[];
  /** False when the API could not be reached and everything is the registry fallback. */
  live: boolean;
};

export async function loadCatalogWorks(): Promise<CatalogLoad> {
  const { artworks, live } = await loadArtworks();
  return { artworks, products: shopProducts(artworks), live };
}

export async function getCatalogWorks(): Promise<Product[]> {
  return (await loadCatalogWorks()).products;
}
