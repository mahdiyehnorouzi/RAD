"use client";
import { useEffect, useRef, useState } from "react";
import { ProductCard, ProductGridSkeleton } from "@/components/product/listing";
import type { Product } from "@rad/types";
import { useCart } from "@/components/cart";
import { useLocale } from "@/components/i18n";
import { useCommerce } from "@/components/commerce";
import { useCatalog } from "../catalog-provider";
import { artworkCategories } from "@/lib/catalog/artwork";
import { ApiError, errorMessage } from "@/lib/api";
import { MoveLeft, MoveRight } from "lucide-react";
import "./catalog.css";

type AvailabilityFilter = "all" | "available" | "reserved" | "sold";

function matchesAvailability(product: Product, availability: AvailabilityFilter) {
  const status = product.status ?? "available";
  if (availability === "all") return true;
  if (availability === "available") return status === "available";
  return status === availability;
}

export function Catalog({ products: seeded = [] }: { products?: Product[] }) {
  const { t, number, locale } = useLocale();
  const { products: liveProducts, loading } = useCatalog();
  const products = liveProducts.length ? liveProducts : seeded;
  const pending = loading && products.length === 0;
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
    { id: "reserved", label: t("filterReserved") },
    { id: "sold", label: t("filterSold") },
  ];
  const [active, setActive] = useState("all");
  const [availability, setAvailability] = useState<AvailabilityFilter>("all");
  const [canSwipe, setCanSwipe] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const visible = products.filter((product) => {
    const byCategory = active === "all" || product.category === active;
    return byCategory && matchesAvailability(product, availability);
  });

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

  return (
    <>
      <div className="catalog-toolbar">
        <section className="catalog-panel catalog-panel--categories">
          <div className="catalog-panel-head">
            <b>{t("artworkCategoriesHeading")}</b>
            {canSwipe ? (
              <span className="filter-scroll-hint">
                {t("swipeToSeeMore")}
                {locale === "fa" ? <MoveLeft aria-hidden="true" /> : <MoveRight aria-hidden="true" />}
              </span>
            ) : null}
          </div>
          <div className={`catalog-rail-shell${canSwipe ? " is-overflowing" : ""}`}>
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
            <div className="catalog-segment" role="group" aria-label={t("availabilityFilterAria")}>
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
      {pending ? (
        <ProductGridSkeleton />
      ) : visible.length ? (
        <div className="product-grid">
          {visible.map((p) => (
            <ProductCard product={p} key={p.slug} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>{t("emptyTitle")}</h2>
          <p>{t("emptyBody")}</p>
          <button
            onClick={() => {
              setActive("all");
              setAvailability("all");
            }}
            className="button"
          >
            {t("seeAll")}
          </button>
        </div>
      )}
    </>
  );
}

export function AddToBag({ product }: { product: Product }) {
  const { add, has } = useCart();
  const { t } = useLocale();
  const { addNotice } = useCommerce();
  const { refresh, getProduct } = useCatalog();
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const live = getProduct(product.slug) ?? product;
  const added = has(live.slug);
  const unavailable =
    blocked || live.status === "sold" || live.status === "reserved";
  const unavailableLabel = live.status === "reserved" ? t("reserved") : t("soldOut");
  return (
    <div className="add-to-bag">
      <button
        type="button"
        className={`button add${added ? " add--in-bag" : ""}`}
        onClick={async () => {
          if (busy) return;
          try {
            setBusy(true);
            setError("");
            const addedToBag = await add(live);
            if (addedToBag) await addNotice("cart", live.slug);
          } catch (err) {
            if (err instanceof ApiError && err.status === 409) {
              setBlocked(true);
              await refresh();
              return;
            }
            setError(errorMessage(err, t("requestFailed")));
          } finally {
            setBusy(false);
          }
        }}
        disabled={added || unavailable || busy}
        aria-live="polite"
      >
        {unavailable ? unavailableLabel : added ? t("inBag") : busy ? t("submitting") : t("addBag")}
      </button>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
