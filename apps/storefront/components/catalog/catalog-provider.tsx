"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type {Product} from "@rad/types";
import { fetchProducts } from "@/lib/api/catalog";

type CatalogContextValue = {
  products: Product[];
  loading: boolean;
  getProduct: (slug: string) => Product | undefined;
  refresh: () => Promise<void>;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setProducts(await fetchProducts());
  };

  useEffect(() => {
    refresh()
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
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
