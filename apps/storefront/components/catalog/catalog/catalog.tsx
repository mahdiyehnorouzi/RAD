"use client";
import { useEffect, useRef, useState } from "react";
import type { Product } from "@rad/types";
import { useCart } from "@/components/cart";
import { useLocale } from "@/components/i18n";
import { useCommerce } from "@/components/commerce";
import { useCatalog } from "../catalog-provider";
import { artworkCategories } from "@/lib/catalog/artwork";
import { ApiError, isNetworkError } from "@/lib/api";
import { isShopStatus, isUpcomingStatus } from "@/lib/catalog/product-status";
import {
  applyCatalogFilters,
  type AvailabilityFilter,
  type CatalogFilters,
} from "@/lib/catalog/filters";
import { normalizeQuery, productMatchesQuery } from "@/lib/catalog/search";
import { useProductStatus } from "@/hooks/use-product-status";
import { MoveLeft, MoveRight } from "lucide-react";
import { CatalogSearch } from "./catalog-search";
import { CatalogResults } from "./catalog-results";
import "./catalog.css";

function matchesAvailability(
  product: Product,
  availability: AvailabilityFilter,
) {
  const status = product.status;
  if (availability === "all") return true;
  if (availability === "upcoming") return isUpcomingStatus(status);
  return status === availability;
}

const defaultFilters: CatalogFilters = {
  query: "",
  category: "all",
  availability: "all",
};

export function Catalog({
  products: seeded = [],
  seededLive = true,
  initialFilters = defaultFilters,
}: {
  products?: Product[];
  /** Whether the server render reached the API; false means `products` are fixtures. */
  seededLive?: boolean;
  initialFilters?: CatalogFilters;
}) {
  const { t, number, locale } = useLocale();
  const { products: liveProducts, loading, status, refresh } = useCatalog();
  const products = loading ? seeded : liveProducts;
  const pending = loading && products.length === 0;
  const failed = status === "error" || (loading && !seededLive);
  const filters = [
    { id: "all", label: t("filterAll") },
    ...artworkCategories.map((category) => ({
      id: category.id,
      label: category.label[locale],
    })),
  ];
  const availabilityFilters: { id: AvailabilityFilter; label: string }[] = [
    { id: "all", label: t("filterAll") },
    { id: "available", label: t("filterAvailable") },
    { id: "upcoming", label: t("filterUpcoming") },
    { id: "sold", label: t("filterSold") },
  ];
  const [active, setActive] = useState(initialFilters.category);
  const [availability, setAvailability] = useState<AvailabilityFilter>(
    initialFilters.availability,
  );
  const [query, setQuery] = useState(initialFilters.query);
  const [canSwipe, setCanSwipe] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const normalizedQuery = normalizeQuery(query, locale);
  const shopProducts = products.filter((product) =>
    isShopStatus(product.status),
  );
  const visible = shopProducts.filter((product) => {
    const byCategory = active === "all" || product.category === active;
    return (
      byCategory &&
      matchesAvailability(product, availability) &&
      productMatchesQuery(product, normalizedQuery, locale)
    );
  });

  useEffect(() => {
    const url = new URL(window.location.href);
    applyCatalogFilters(url.searchParams, {
      query,
      category: active,
      availability,
    });
    if (url.href !== window.location.href) {
      window.history.replaceState(window.history.state, "", url);
    }
  }, [query, active, availability]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return undefined;
    const sync = () => setCanSwipe(node.scrollWidth > node.clientWidth + 2);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(node);
    node.addEventListener("scroll", sync, { passive: true });
    return () => {
      observer.disconnect();
      node.removeEventListener("scroll", sync);
    };
  }, [filters.length]);

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
      <div className="catalog-toolbar">
        <CatalogSearch value={query} onChange={setQuery} />
        <section className="catalog-panel catalog-panel--categories">
          <div className="catalog-panel-head">
            <b>{t("artworkCategoriesHeading")}</b>
            {canSwipe ? (
              <span className="filter-scroll-hint">
                {t("swipeToSeeMore")}
                {locale === "fa" ? (
                  <MoveLeft aria-hidden="true" />
                ) : (
                  <MoveRight aria-hidden="true" />
                )}
              </span>
            ) : null}
          </div>
          <div
            className={`catalog-rail-shell${canSwipe ? " is-overflowing" : ""}`}
          >
            <div
              ref={scrollRef}
              className="catalog-rail"
              tabIndex={0}
              aria-label={t("filterCategoriesAria")}
            >
              {filters.map((x) => (
                <button
                  type="button"
                  key={x.id}
                  className={active === x.id ? "active" : ""}
                  onClick={() => setActive(x.id)}
                  aria-pressed={active === x.id}
                >
                  {x.label}
                </button>
              ))}
            </div>
          </div>
        </section>
        <section className="catalog-panel catalog-panel--availability">
          <div className="catalog-availability-row">
            <b>{t("availabilityHeading")}</b>
            <div
              className="catalog-segment"
              role="group"
              aria-label={t("availabilityFilterAria")}
            >
              {availabilityFilters.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={availability === item.id ? "active" : ""}
                  data-status={item.id}
                  onClick={() => setAvailability(item.id)}
                  aria-pressed={availability === item.id}
                >
                  <i aria-hidden="true" />
                  {item.label}
                </button>
              ))}
            </div>
            <span className="catalog-count">
              {number(visible.length)} {t("availableWorks")}
            </span>
          </div>
        </section>
      </div>
      <CatalogResults
        visible={visible}
        shopCount={shopProducts.length}
        pending={pending}
        failed={failed}
        retrying={retrying}
        filters={{ query, category: active, availability }}
        onRetry={() => void retry()}
        onClearQuery={() => setQuery("")}
        onClearFilters={() => {
          setActive("all");
          setAvailability("all");
        }}
        onReset={() => {
          setActive("all");
          setAvailability("all");
          setQuery("");
        }}
      />
    </>
  );
}

export function AddToBag({
  product,
  onConflict,
}: {
  product: Product;
  /** Called after the API refuses the add (taken or withdrawn) so the page can re-check. */
  onConflict?: () => void;
}) {
  const { add } = useCart();
  const { t } = useLocale();
  const { addNotice } = useCommerce();
  const { refresh, getProduct } = useCatalog();
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const catalogProduct = getProduct(product.slug);
  const live = product.status ? product : (catalogProduct ?? product);
  const { inBag: added, purchasable, label } = useProductStatus(live);
  const unavailable = blocked || (!added && !purchasable);
  const unavailableLabel = label && !purchasable ? label : t("soldOut");

  useEffect(() => {
    if (live.status !== "available") return;
    setBlocked(false);
    setError("");
  }, [live.status, live.reservedUntil]);
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
            const addPromise = add(live);
            // Optimistic cart update flips `added` immediately; clear busy so UI isn't frozen.
            setBusy(false);
            const addedToBag = await addPromise;
            if (addedToBag) {
              void addNotice("cart", live.slug).catch(() => {});
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
        {added
          ? t("inBag")
          : unavailable
            ? unavailableLabel
            : busy
              ? t("submitting")
              : t("addBag")}
      </button>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
