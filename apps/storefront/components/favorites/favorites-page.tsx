"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useCommerce } from "@/components/commerce";
import { useLocale } from "@/components/i18n";
import { ProductCard } from "@/components/product";
import { useCatalog } from "@/components/catalog";

export function FavoritesPage() {
  const params = useSearchParams();
  const { favorites } = useCommerce();
  const { t, number } = useLocale();
  const { getProduct } = useCatalog();
  const [shared, setShared] = useState(false);

  const sharedSlugs = params.get("items")?.split(",").filter(Boolean);
  const slugs = sharedSlugs?.length ? sharedSlugs : favorites;

  const items = useMemo(
    () => slugs.map((slug) => getProduct(slug)).filter(Boolean),
    [slugs.join(","), getProduct],
  );

  const share = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set("items", favorites.join(","));
    try {
      if (navigator.share)
        await navigator.share({
          title: t("favoritesTitle"),
          text: t("shareFavoritesText"),
          url: url.toString(),
        });
      else await navigator.clipboard.writeText(url.toString());
      setShared(true);
    } catch {}
  };

  return (
    <section className="favorites-page section">
      <header className="favorites-heading">
        <div>
          <span className="eyebrow">
            {sharedSlugs?.length
              ? t("sharedListEyebrow")
              : t("favoriteEyebrow")}
          </span>
          <h1>{t("favoritesTitle")}</h1>
          <p>
            {number(items.length)} {t("savedWorks")}
          </p>
        </div>
        {!sharedSlugs?.length && favorites.length > 0 && (
          <button type="button" className="button outline" onClick={share}>
            {shared ? t("linkCopied") : t("shareList")}
          </button>
        )}
      </header>
      {items.length ? (
        <div className="product-grid">
          {items.map(
            (item, index) =>
              item && (
                <ProductCard key={item.slug} product={item} index={index} />
              ),
          )}
        </div>
      ) : (
        <div className="empty-state">
          <h2>{t("emptyFavorites")}</h2>
          <p>{t("emptyFavoritesBody")}</p>
        </div>
      )}
    </section>
  );
}
