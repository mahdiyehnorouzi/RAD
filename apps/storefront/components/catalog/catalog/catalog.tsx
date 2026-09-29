"use client";
import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import type { Product } from "@rad/types";
import { useCart } from "@/components/cart";
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
  const [filtersOpen, setFiltersOpen] = useState(
    () => panelRefinements(initialFilters) > 0,
  );
  const shopProducts = shopFloor(products);
  const visible = refineCatalog(shopProducts, state, locale);
  const artistCounts = new Map(
    catalogArtists(
      refineCatalog(shopProducts, { ...state, artist: "all" }, locale),
    ).map((artist) => [artist.key, artist.count]),
  );
  const artists = catalogArtists(shopProducts).map((artist) => ({
    ...artist,
    count: artistCounts.get(artist.key) ?? 0,
  }));
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
        sort={state.sort}
        onSort={(sort) => update({ sort })}
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
      <CatalogFilterPanel
        id={panelId}
        open={filtersOpen}
        filters={state}
        activeCount={activeFilters}
        artists={artists}
        onChange={update}
        onClear={() => update(clearedPanel)}
      />
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
}: {
  product: Product;
  /** Called after the API refuses the add (taken or withdrawn) so the page can re-check. */
  onConflict?: () => void;
  icon?: React.ReactNode;
}) {
  const { add } = useCart();
  const { t, href } = useLocale();
  const { addNotice } = useCommerce();
  const refresh = useCatalogRefresh();
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const { inBag: added, purchasable, label } = useProductStatus(product);
  const unavailable = blocked || (!added && !purchasable);
  const unavailableLabel = label && !purchasable ? label : t("soldOut");

  useEffect(() => {
    if (product.status !== "available") return;
    setBlocked(false);
    setError("");
  }, [product.status, product.reservedUntil]);
  return (
    <div className="add-to-bag">
      <button
        type="button"
        className={`button add${added ? " add--in-bag" : ""}`}
        onClick={async () => {
          if (busy || added) return;
          try {
            setBusy(true);
            setError("");
            const addPromise = add(product);
            // Optimistic cart update flips `added` immediately; clear busy so UI isn't frozen.
            setBusy(false);
            const addedToBag = await addPromise;
            if (addedToBag) {
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
        {added
          ? t("inBag")
          : unavailable
            ? unavailableLabel
            : busy
              ? t("submitting")
              : t("addBag")}
      </button>
      {added ? (
        <Link className="add-to-bag-next" href={href("/cart")}>
          {t("goToBag")}
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
