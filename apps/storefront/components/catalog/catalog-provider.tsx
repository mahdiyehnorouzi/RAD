"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Artwork, Product } from "@rad/types";
import { fallbackArtworks, findArtwork, shopProducts } from "@/lib/artworks";
import { loadCatalogWorks } from "@/lib/catalog/get-catalog-works";

/** `idle` until the first client refresh settles; `error` means the API was unreachable. */
export type CatalogStatus = "idle" | "refreshing" | "live" | "error";

type CatalogContextValue = {
  /** Every public artwork; the one record all sections render from. */
  artworks: Artwork[];
  /** The shop projection of `artworks`. */
  products: Product[];
  loading: boolean;
  status: CatalogStatus;
  getArtwork: (key: string | number) => Artwork | undefined;
  getProduct: (slug: string) => Product | undefined;
  refresh: () => Promise<void>;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [artworks, setArtworks] = useState<Artwork[]>(fallbackArtworks);
  const [status, setStatus] = useState<CatalogStatus>("idle");

  const refresh = useCallback(async () => {
    setStatus((current) => (current === "idle" ? current : "refreshing"));
    const result = await loadCatalogWorks();
    setArtworks(result.artworks);
    setStatus(result.live ? "live" : "error");
  }, []);

  useEffect(() => {
    void refresh();
    const onOnline = () => void refresh();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [refresh]);

  const value = useMemo<CatalogContextValue>(() => {
    const products = shopProducts(artworks);
    return {
      artworks,
      products,
      loading: status === "idle",
      status,
      getArtwork: (key) => findArtwork(artworks, key),
      getProduct: (slug) => products.find((product) => product.slug === slug),
      refresh,
    };
  }, [artworks, status, refresh]);

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  );
}

export function useCatalog() {
  const value = useContext(CatalogContext);
  if (!value) throw new Error("useCatalog must be used inside CatalogProvider");
  return value;
}
