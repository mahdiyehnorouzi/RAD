"use client";

import { useState } from "react";
import { ProductCard, ProductGrid } from "@/components/product";
import { Button } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/section";
import { useCatalog } from "@/components/catalog/catalog-provider";
import { useLocale } from "@/components/i18n";
import { CatalogFilters } from "./catalog-filters";

export function Catalog() {
  const { t } = useLocale();
  const { products } = useCatalog();
  const [active, setActive] = useState("all");
  const visible =
    active === "all" ? products : products.filter((product) => product.category === active);

  return (
    <>
      <CatalogFilters active={active} onChange={setActive} count={visible.length} />
      {visible.length ? (
        <ProductGrid>
          {visible.map((product, index) => (
            <ProductCard product={product} index={index} key={product.slug} />
          ))}
        </ProductGrid>
      ) : (
        <EmptyState title={t("emptyTitle")} body={t("emptyBody")}>
          <Button onClick={() => setActive("all")}>{t("seeAll")}</Button>
        </EmptyState>
      )}
    </>
  );
}
