"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@rad/types";
import { fetchProducts } from "@/lib/api";
import { hasRealProductImage } from "@/lib/catalog/category-defaults";
import { photoWorks } from "@/lib/catalog/photo-works";
import { overlayRemoteCatalog } from "@/lib/catalog/resolve-product";

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
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      const remote = await fetchProducts();
      if (!mounted.current) return;
      const list = Array.isArray(remote) ? remote : [];
      setProducts(
        list.some(hasRealProductImage)
          ? list
          : overlayRemoteCatalog(photoWorks, list),
      );
    } catch {
      if (!mounted.current) return;
      setProducts(photoWorks);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    refresh().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const value = useMemo<CatalogContextValue>(
    () => ({
      products,
      loading,
      getProduct: (slug) => products.find((product) => product.slug === slug),
      refresh,
    }),
    [products, loading, refresh],
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
