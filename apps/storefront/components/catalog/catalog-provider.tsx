"use client";

import { createContext, useContext, useMemo } from "react";
import type { Artwork, Product } from "@rad/types";
import { findArtwork } from "@/lib/artworks";
import { useCatalogRefresh } from "@/hooks/use-catalog-refresh";

type CatalogContextValue = {
  /** Public artworks, when the route passed them; most routes only need `products`. */
  artworks: Artwork[];
  /** Works offered in the shop. */
  products: Product[];
  /** False when the server could not reach the API and the data is the registry fallback. */
  live: boolean;
  getArtwork: (key: string | number) => Artwork | undefined;
  getProduct: (slug: string) => Product | undefined;
  refresh: () => Promise<void>;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

/**
 * Server-fetched catalog data for the routes that look works up by slug (bag,
 * checkout, orders, favourites, account). Placed by those routes' layouts.
 */
export function CatalogProvider({
  products,
  artworks = [],
  live,
  children,
}: {
  products: Product[];
  artworks?: Artwork[];
  live: boolean;
  children: React.ReactNode;
}) {
  const refresh = useCatalogRefresh();

  const value = useMemo<CatalogContextValue>(() => {
    const bySlug = new Map(products.map((product) => [product.slug, product]));
    return {
      artworks,
      products,
      live,
      getArtwork: (key) => findArtwork(artworks, key),
      getProduct: (slug) => bySlug.get(slug),
      refresh,
    };
  }, [artworks, products, live, refresh]);

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  );
}

export function useCatalog() {
  const value = useContext(CatalogContext);
  if (!value) throw new Error("useCatalog must be used inside CatalogProvider");
  return value;
}
