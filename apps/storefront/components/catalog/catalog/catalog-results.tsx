"use client";

import type { Product } from "@rad/types";
import { ProductCard, ProductGridSkeleton } from "@/components/product/listing";
import { StateNotice, StatePanel } from "@/components/ui/state-panel";
import { Button, ButtonLink } from "@/components/ui/button-link";
import { useLocale } from "@/components/i18n";
import { categoryLabel } from "@/lib/catalog/artwork";
import type { CatalogFilters } from "@/lib/catalog/filters";

export function CatalogResults({
  visible,
  shopCount,
  pending,
  failed,
  retrying,
  filters,
  onRetry,
  onClearQuery,
  onClearFilters,
  onReset,
}: {
  visible: Product[];
  /** Works on the shop floor before any filter; 0 means the collection itself is empty. */
  shopCount: number;
  pending: boolean;
  failed: boolean;
  retrying: boolean;
  filters: CatalogFilters;
  onRetry: () => void;
  onClearQuery: () => void;
  onClearFilters: () => void;
  onReset: () => void;
}) {
  const { t, locale } = useLocale();
  const query = filters.query.trim();
  const filtered = filters.category !== "all" || filters.availability !== "all";
  const retryButton = (
    <button
      type="button"
      className="state-action"
      onClick={onRetry}
      disabled={retrying}
    >
      {retrying ? t("retrying") : t("retry")}
    </button>
  );

  if (pending) return <ProductGridSkeleton />;

  if (failed && shopCount === 0) {
    return (
      <StatePanel
        tone="error"
        title={t("catalogErrorTitle")}
        actions={retryButton}
      >
        <p>{t("catalogErrorBody")}</p>
      </StatePanel>
    );
  }

  if (shopCount === 0) {
    return (
      <StatePanel
        title={t("catalogEmptyTitle")}
        actions={
          <>
            <ButtonLink href="/archive">{t("viewArchive")}</ButtonLink>
            <ButtonLink href="/studio" outline>
              {t("commissionOwn")}
            </ButtonLink>
          </>
        }
      >
        <p>{t("catalogEmptyBody")}</p>
      </StatePanel>
    );
  }

  const staleNotice = failed ? (
    <StateNotice tone="error" action={retryButton} className="catalog-notice">
      <p>{t("catalogStaleNotice")}</p>
    </StateNotice>
  ) : null;

  if (visible.length) {
    return (
      <>
        {staleNotice}
        <div className="product-grid">
          {visible.map((product) => (
            <ProductCard product={product} key={product.slug} />
          ))}
        </div>
      </>
    );
  }

  if (query) {
    return (
      <>
        {staleNotice}
        <StatePanel
          title={t("noSearchTitle", { query })}
          actions={
            <>
              {filtered ? (
                <Button onClick={onClearFilters}>{t("searchAllWorks")}</Button>
              ) : null}
              <button
                type="button"
                className="state-action"
                onClick={onClearQuery}
              >
                {t("clearSearch")}
              </button>
            </>
          }
        >
          <p>{t("noSearchBody")}</p>
        </StatePanel>
      </>
    );
  }

  if (filters.category !== "all") {
    return (
      <>
        {staleNotice}
        <StatePanel
          title={t("noCategoryTitle", {
            category: categoryLabel(filters.category, locale),
          })}
          actions={
            <>
              <Button onClick={onReset}>{t("seeAll")}</Button>
              <ButtonLink href="/studio" outline>
                {t("commissionOwn")}
              </ButtonLink>
            </>
          }
        >
          <p>{t("noCategoryBody")}</p>
        </StatePanel>
      </>
    );
  }

  return (
    <>
      {staleNotice}
      <StatePanel
        title={t("emptyTitle")}
        actions={<Button onClick={onReset}>{t("seeAll")}</Button>}
      >
        <p>{t("emptyBody")}</p>
      </StatePanel>
    </>
  );
}
