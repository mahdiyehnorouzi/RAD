"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Product } from "@rad/types";
import { fetchProducts } from "@/lib/api";
import {
  hasRealProductImage,
  overlayLiveCatalog,
} from "@/lib/catalog/category-defaults";
import { photoWorks } from "@/lib/catalog/photo-works";

type CatalogContextValue = {
  products: Product[];
  loading: boolean;
  getProduct: (slug: string) => Product | undefined;
  refresh: () => Promise<void>;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(photoWorks);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const remote = await fetchProducts();
      const list = Array.isArray(remote) ? remote : [];
      const display = list.some(hasRealProductImage) ? list : photoWorks;
      setProducts(overlayLiveCatalog(display, list));
    } catch {
      setProducts(photoWorks);
    }
  };

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const value = useMemo<CatalogContextValue>(
    () => ({
      products,
      loading,
      getProduct: (slug) => products.find((product) => product.slug === slug),
      refresh,
    }),
    [products, loading],
  );

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  );
}

export function useCatalog() {
  const value = useContext(CatalogContext);
  if (!value) throw new Error("useCatalog must be used inside CatalogProvider");
  return value;
}
