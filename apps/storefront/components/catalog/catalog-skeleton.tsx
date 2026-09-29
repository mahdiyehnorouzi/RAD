"use client";

import { ProductGridSkeleton } from "@/components/product/listing";
import { Skeleton } from "@/components/ui/skeleton";
import { PageSection } from "@/components/ui/section";
import { CatalogHero } from "./catalog";
import { CatalogIntro } from "./catalog-intro";
import "./catalog/catalog.css";

/** Route-level fallback for `/products` while the catalog streams in. */
export function CatalogSkeleton() {
  return (
    <PageSection className="plp">
      <CatalogHero intro={<CatalogIntro />} />
      <div className="plp-categories" aria-hidden="true">
        <div className="plp-chip-rail">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton className="plp-chip-skeleton" key={index} />
          ))}
        </div>
      </div>
      <div className="plp-bar" aria-hidden="true">
        <Skeleton className="plp-bar-skeleton" />
        <Skeleton className="plp-bar-skeleton" />
      </div>
      <ProductGridSkeleton
        count={8}
        className="product-grid product-grid--catalog"
      />
    </PageSection>
  );
}
