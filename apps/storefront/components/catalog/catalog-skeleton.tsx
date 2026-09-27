"use client";

import { ProductGridSkeleton } from "@/components/product/listing";
import { Skeleton } from "@/components/ui/skeleton";
import { PageSection } from "@/components/ui/section";
import { useLocale } from "@/components/i18n";
import "./catalog/catalog.css";

/** Route-level fallback for `/products` while the catalog streams in. */
export function CatalogSkeleton() {
  const { t } = useLocale();
  return (
    <PageSection className="plp">
      <header className="mb-4">
        <span className="eyebrow">{t("shopEyebrow")}</span>
        <h1 className="m-0 text-h2 font-normal">{t("shopTitle")}</h1>
        <p className="mt-3 max-w-2xl text-prose">{t("shopBody")}</p>
      </header>
      <div className="catalog-toolbar" aria-hidden="true">
        <Skeleton className="catalog-search-skeleton" />
        <Skeleton className="skeleton-line" style={{ height: "2.4rem" }} />
        <Skeleton className="skeleton-line" style={{ height: "2.4rem" }} />
      </div>
      <ProductGridSkeleton />
    </PageSection>
  );
}
