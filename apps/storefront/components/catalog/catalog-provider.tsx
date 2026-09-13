"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Product } from "@rad/types";
import { displayWorks, getCatalogWorks } from "@/lib/catalog/get-catalog-works";

type CatalogContextValue = {
  products: Product[];
  loading: boolean;
  getProduct: (slug: string) => Product | undefined;
  refresh: () => Promise<void>;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(displayWorks);

  const refresh = async () => {
    setProducts(await getCatalogWorks());
  };

  useEffect(() => {
    void refresh();
  }, []);

  const value = useMemo<CatalogContextValue>(
    () => ({
      products,
      loading: false,
      getProduct: (slug) => products.find((product) => product.slug === slug),
      refresh,
    }),
    [products],
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
