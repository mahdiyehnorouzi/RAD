"use client";
import { useState } from "react";
import { ProductCard } from "@/components/product/listing";
import type { Product } from "@rad/types";
import { useCart } from "@/components/cart";
import { useLocale } from "@/components/i18n";
import { useCommerce } from "@/components/commerce";
import { useCatalog } from "../catalog-provider";
import { artworkCategories } from "@/lib/catalog/artwork";
import { ApiError, errorMessage } from "@/lib/api";
import { MoveLeft, MoveRight } from "lucide-react";
import "./catalog.css";

export function Catalog() {
  const { t, number, locale } = useLocale();
  const { products } = useCatalog();
  const filters = [
    { id: "all", label: t("filterAll") },
    ...artworkCategories.map((category) => ({
      id: category.id,
      label: category.label[locale],
    })),
  ];
  const [active, setActive] = useState("all");
  const visible =
    active === "all"
      ? products
      : products.filter((product) => product.category === active);

  return (
    <>
      <div className="filterbar">
        <div className="filter-heading">
          <b>{locale === "fa" ? "دسته‌بندی آثار" : "Artwork categories"}</b>
          <span className="filter-scroll-hint">
            {locale === "fa" ? "برای دیدن بیشتر بکشید" : "Swipe to see more"}
            {locale === "fa" ? <MoveLeft aria-hidden="true" /> : <MoveRight aria-hidden="true" />}
          </span>
        </div>
        <div className="filter-scroll-shell">
          <div
            className="filter-scroll"
            tabIndex={0}
            aria-label={locale === "fa" ? "فیلتر دسته‌بندی آثار" : "Filter artwork categories"}
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
        <span className="filter-count">
          {number(visible.length)} {t("availableWorks")}
        </span>
      </div>
      {visible.length ? (
        <div className="product-grid">
          {visible.map((p, i) => (
            <ProductCard product={p} index={i} key={p.slug} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>{t("emptyTitle")}</h2>
          <p>{t("emptyBody")}</p>
          <button onClick={() => setActive("all")} className="button">
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
  const live = getProduct(product.slug) ?? product;
  const added = has(live.slug);
  const unavailable =
    blocked || live.status === "sold" || live.status === "reserved";
  const unavailableLabel = live.status === "reserved" ? t("reserved") : t("soldOut");
  return (
    <div className="add-to-bag">
      <button
        type="button"
        className="button add"
        onClick={async () => {
          try {
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
          }
        }}
        disabled={added || unavailable}
        aria-live="polite"
      >
        {unavailable ? unavailableLabel : added ? t("inBag") : t("addBag")}
      </button>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
