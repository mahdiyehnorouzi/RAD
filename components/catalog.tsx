"use client";
import { useState } from "react";
import { products } from "@/lib/products";
import { ProductCard } from "./site";
import type { Product } from "@/lib/products";
import { useCart } from "./cart";
import { useLocale } from "./i18n";
import { useCommerce } from "./commerce";

export function Catalog() {
  const { t, number } = useLocale();
  const filters = [
    { id: "all", label: t("filterAll") },
    { id: "vases", label: t("filterVases") },
    { id: "tableware", label: t("filterTableware") },
    { id: "sculpture", label: t("filterSculpture") },
  ];
  const [active, setActive] = useState("all");
  const visible = active === "all" ? products : products.filter((product) => product.category === active);
  return (
    <>
      <div className="filterbar">
        <div>
          {filters.map((x) => (
            <button
              key={x.id}
              className={active === x.id ? "active" : ""}
              onClick={() => setActive(x.id)}
              aria-pressed={active === x.id}
            >
              {x.label}
            </button>
          ))}
        </div>
        <span>
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
  const added = has(product.slug);
  return (
    <button
      className="button add"
      onClick={() => { add(product); addNotice("cart", product.slug); }}
      disabled={added}
      aria-live="polite"
    >
      {added ? t("inBag") : t("addBag")}
    </button>
  );
}
