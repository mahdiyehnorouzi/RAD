"use client";

import type { Product } from "@rad/types";
import { ProductGridSkeleton } from "@/components/product/listing";
import { StateNotice } from "@/components/ui/state-panel";
import { Button, ButtonLink } from "@/components/ui/button-link";
import { useLocale } from "@/components/i18n";
import {
  EmptyCategoryState,
  ErrorState,
  NoResultsState,
} from "@/components/states";
import { artworkCategories, categoryLabel } from "@/lib/catalog/artwork";
import { hasRefinements, type CatalogFilters } from "@/lib/catalog/filters";
import { categoryChipLabels } from "../const";
import { CatalogCard } from "./catalog-card";

export function CatalogResults({
  visible,
  shopCount,
  stockedCategories,
  pending,
  failed,
  retrying,
  filters,
  onRetry,
  onClearQuery,
  onClearFilters,
  onReset,
  onPickCategory,
}: {
  visible: Product[];
  /** Works on the shop floor before any filter; 0 means the collection itself is empty. */
  shopCount: number;
  /** Categories that hold at least one work on the shop floor. */
  stockedCategories: string[];
  pending: boolean;
  failed: boolean;
  retrying: boolean;
  filters: CatalogFilters;
  onRetry: () => void;
  onClearQuery: () => void;
  onClearFilters: () => void;
  onReset: () => void;
  onPickCategory: (category: string) => void;
}) {
  const { t, locale } = useLocale();
  const query = filters.query.trim();
  const filtered = hasRefinements(filters);
  const onlyCategory =
    filters.category !== "all" &&
    !hasRefinements({ ...filters, category: "all" });
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

  if (pending) {
    return (
      <ProductGridSkeleton
        count={8}
        className="product-grid product-grid--catalog"
      />
    );
  }

  if (failed && shopCount === 0) {
    return (
      <ErrorState
        layout="stack"
        onRetry={onRetry}
        retrying={retrying}
        title="catalogErrorTitle"
        body="catalogErrorBody"
      />
    );
  }

  if (shopCount === 0) {
    return (
      <EmptyCategoryState
        title={t("catalogEmptyTitle")}
        body={t("catalogEmptyBody")}
        actions={
          <>
            <ButtonLink href="/studio">{t("commissionOwn")}</ButtonLink>
            <ButtonLink href="/now" outline>
              {t("footerNow")}
            </ButtonLink>
          </>
        }
      />
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
        <div className="product-grid product-grid--catalog">
          {visible.map((product) => (
            <CatalogCard product={product} key={product.slug} />
          ))}
        </div>
      </>
    );
  }

  if (query) {
    const categories = artworkCategories
      .filter((category) => stockedCategories.includes(category.id))
      .map((category) => ({
        id: category.id,
        label: (categoryChipLabels[category.id] ?? category.shortLabel)[locale],
        onSelect: () => onPickCategory(category.id),
      }));
    return (
      <>
        {staleNotice}
        <NoResultsState
          query={query}
          onClearQuery={onClearQuery}
          categories={categories}
          actions={
            <>
              <Button onClick={onReset}>{t("seeAll")}</Button>
              {filtered ? (
                <Button outline onClick={onClearFilters}>
                  {t("searchAllWorks")}
                </Button>
              ) : null}
            </>
          }
        />
      </>
    );
  }

  if (onlyCategory) {
    return (
      <>
        {staleNotice}
        <EmptyCategoryState
          title={t("noCategoryTitle", {
            category: categoryLabel(filters.category, locale),
          })}
          body={t("noCategoryBody")}
          actions={
            <>
              <Button onClick={onReset}>{t("seeAll")}</Button>
              <ButtonLink href="/studio" outline>
                {t("commissionOwn")}
              </ButtonLink>
            </>
          }
        />
      </>
    );
  }

  return (
    <>
      {staleNotice}
      <EmptyCategoryState
        title={t("emptyTitle")}
        body={t("emptyBody")}
        actions={
          <>
            <Button onClick={onClearFilters}>{t("clearFilters")}</Button>
            <Button outline onClick={onReset}>
              {t("seeAll")}
            </Button>
          </>
        }
      />
    </>
  );
}
