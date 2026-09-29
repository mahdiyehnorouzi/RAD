import "server-only";
import { cache } from "react";
import type { Artwork, Product } from "@rad/types";
import { shopProducts } from "@/lib/artworks";
import {
  fallbackArtworks,
  loadArtworks,
  type ArtworksOrigin,
} from "@/lib/artworks/server";
import type { CatalogIndexEntry } from "./catalog-index";
import { CATALOG_TAG } from "./catalog-tag";

type CatalogLoad = {
  artworks: Artwork[];
  /** The shop projection of `artworks`. */
  products: Product[];
  /** `registry` when the API was skipped or unreachable; see CATALOG_SOURCE. */
  origin: ArtworksOrigin;
};

/** Registry shop works, for build-time static params only; pages render {@link getCatalog}. */
export function registryProducts(): Product[] {
  return shopProducts(fallbackArtworks);
}

/**
 * The public catalog, shared by every request for 30 seconds and deduplicated
 * within a render. Purchases and bag changes expire it through `refreshCatalog`.
 */
export const getCatalog = cache(async (): Promise<CatalogLoad> => {
  const { artworks, origin } = await loadArtworks({
    next: { revalidate: 30, tags: [CATALOG_TAG] },
    timeoutMs: 8_000,
  });
  return { artworks, products: shopProducts(artworks), origin };
});

/** Names and numbers only: enough for breadcrumbs, toasts and notices on every page. */
export const getCatalogIndex = cache(async (): Promise<CatalogIndexEntry[]> => {
  const { artworks, products } = await getCatalog();
  const inShop = new Set(products.map((product) => product.slug));
  return artworks.map((artwork) => ({
    slug: artwork.slug,
    radNumber: artwork.radNumber ?? undefined,
    category: artwork.category,
    title: artwork.title,
    inShop: inShop.has(artwork.slug),
    hasDifference: Boolean(artwork.difference),
  }));
});
