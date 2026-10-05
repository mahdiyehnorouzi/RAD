"use client";
import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import type { Product } from "@rad/types";
import { useCart } from "@/features/cart";
import { useLocale } from "@/components/i18n";
import { useCommerce } from "@/components/commerce";
import { useCatalogRefresh } from "@/hooks/use-catalog-refresh";
import { ApiError, isNetworkError } from "@/lib/api";
import {
  defaultCatalogFilters,
  type CatalogFilters,
} from "@/lib/catalog/filters";
import { catalogArtists, refineCatalog, shopFloor } from "@/lib/catalog/refine";
import { useProductStatus } from "@/hooks/use-product-status";
import { BagAddedSheet } from "./bag-added-sheet";
import { CatalogBar } from "./catalog-bar";
import { CatalogCategories } from "./catalog-categories";
import { CatalogFilterPanel } from "./catalog-filters";
import { CatalogHero } from "./catalog-hero";
import { CatalogQuery } from "./catalog-query";
import { CatalogResults } from "./catalog-results";
import { useCatalogFilters } from "./hooks";
import "./catalog.css";

const clearedPanel: Partial<CatalogFilters> = {
  status: "all",
  artist: "all",
  minPrice: null,
  maxPrice: null,
};

const clearedRefinements: Partial<CatalogFilters> = {
  ...clearedPanel,
  category: "all",
};

function panelRefinements(filters: CatalogFilters) {
  return [
    filters.status !== "all",
    filters.artist !== "all",
    filters.minPrice !== null || filters.maxPrice !== null,
  ].filter(Boolean).length;
}

export function Catalog({
  products,
  live,
  initialFilters = defaultCatalogFilters,
  intro,
}: {
  products: Product[];
  /** Whether the server render reached the API; false means `products` are fixtures. */
  live: boolean;
  initialFilters?: CatalogFilters;
  /** Page title block shown on the banner. */
  intro?: React.ReactNode;
}) {
  const { locale } = useLocale();
  const refresh = useCatalogRefresh();
  const failed = !live;
  const { filters: state, update } = useCatalogFilters(initialFilters);
  const panelId = useId();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const shopProducts = shopFloor(products);
  const visible = refineCatalog(shopProducts, state, locale);
  const artists = catalogArtists(shopProducts);
  const activeFilters = panelRefinements(state);

  const [retrying, setRetrying] = useState(false);
  const retry = async () => {
    setRetrying(true);
    try {
      await refresh();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <>
      <CatalogHero intro={intro} />
      <CatalogCategories
        products={shopProducts}
        active={state.category}
        onSelect={(category) => update({ category })}
      />
      <CatalogBar
        count={visible.length}
        filtersOpen={filtersOpen}
        activeFilters={activeFilters}
        panelId={panelId}
        onToggleFilters={() => setFiltersOpen((open) => !open)}
      />
      {state.query.trim() ? (
        <CatalogQuery
          query={state.query.trim()}
          onClear={() => update({ query: "" })}
        />
      ) : null}
      {filtersOpen ? (
        <CatalogFilterPanel
          id={panelId}
          filters={state}
          artists={artists}
          onChange={update}
          onClose={() => setFiltersOpen(false)}
        />
      ) : null}
      <CatalogResults
        visible={visible}
        shopCount={shopProducts.length}
        pending={false}
        failed={failed}
        retrying={retrying}
        filters={state}
        onRetry={() => void retry()}
        stockedCategories={[
          ...new Set(shopProducts.map((product) => product.category)),
        ]}
        onClearQuery={() => update({ query: "" })}
        onClearFilters={() => update(clearedRefinements)}
        onReset={() => update({ ...clearedRefinements, query: "" })}
        onPickCategory={(category) =>
          update({ ...clearedRefinements, query: "", category })
        }
      />
    </>
  );
}

export function AddToBag({
  product,
  onConflict,
  icon,
  compact = false,
}: {
  product: Product;
  /** Called after the API refuses the add (taken or withdrawn) so the page can re-check. */
  onConflict?: () => void;
  icon?: React.ReactNode;
  compact?: boolean;
}) {
  const { add } = useCart();
  const { locale, t, href } = useLocale();
  const Forward = locale === "fa" ? ChevronLeft : ChevronRight;
  const { addNotice } = useCommerce();
  const refresh = useCatalogRefresh();
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [addedSheet, setAddedSheet] = useState(false);
  const { inBag: added, purchasable, label } = useProductStatus(product);
  const unavailable = blocked || (!added && !purchasable);
  const unavailableLabel = label && !purchasable ? label : t("soldOut");

  useEffect(() => {
    if (product.status !== "available") return;
    setBlocked(false);
    setError("");
  }, [product.status, product.reservedUntil]);
  return (
    <div className={`add-to-bag${compact ? " add-to-bag--compact" : ""}`}>
      <button
        type="button"
        className={`${compact ? "plp-bag-button" : "button"} add${added ? " add--in-bag" : ""}`}
        onClick={async () => {
          if (busy || added) return;
          try {
            setBusy(true);
            setError("");
            // Stay busy/disabled until the API confirms the add — there's no
            // optimistic flip to lean on, so a second click here before the
            // request settles must not fire a second POST.
            const addedToBag = await add(product);
            setBusy(false);
            if (addedToBag) {
              setAddedSheet(true);
              void addNotice("cart", product.slug).catch(() => {});
            }
          } catch (err) {
            setBusy(false);
            if (
              err instanceof ApiError &&
              (err.status === 409 || err.status === 404)
            ) {
              setBlocked(true);
              setError(
                err.status === 404 ? t("liveDeletedTitle") : t("addBagTaken"),
              );
              onConflict?.();
              await refresh();
              return;
            }
            setError(
              isNetworkError(err) ? t("addBagNetwork") : t("addBagFailed"),
            );
          }
        }}
        disabled={added || unavailable || busy}
        aria-live="polite"
      >
        {added ? <Check aria-hidden="true" /> : icon}
        <span className={compact ? "sr-only" : undefined}>
          {added
            ? t("inBag")
            : unavailable
              ? unavailableLabel
              : busy
                ? t("submitting")
                : t("addBag")}
        </span>
      </button>
      {addedSheet && (
        <BagAddedSheet product={product} onClose={() => setAddedSheet(false)} />
      )}
      {added && !compact ? (
        <Link className="add-to-bag-next" href={href("/cart")}>
          <svg
            className="add-to-bag-next-thread"
            viewBox="0 0 96 56"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M58 -2c-6 10 8 16 2 26s-22 10-26 20 6 12 2 16" />
          </svg>
          <ShoppingBag aria-hidden="true" />
          <span>{t("goToBag")}</span>
          <Forward className="add-to-bag-next-arrow" aria-hidden="true" />
        </Link>
      ) : null}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
