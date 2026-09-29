"use client";
import "./favorites-page.css";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Heart, Share2 } from "lucide-react";
import { useCommerce } from "@/components/commerce";
import { useLocale } from "@/components/i18n";
import { ProductCard } from "@/components/product";
import { useCatalog } from "@/components/catalog";
import { EmptyFavoritesState } from "@/components/states";
import { availableWorks } from "@/lib/catalog/product-status";
import { AccountShell } from "../account/account-shell";
import { AccountHeading } from "../account/account-heading";

export function FavoritesPage() {
  const params = useSearchParams();
  const { favorites, ready } = useCommerce();
  const { t, number } = useLocale();
  const { products, getProduct } = useCatalog();
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

  const waiting = !sharedSlugs?.length && !ready;

  const content = (
    <section className="favorites-page section">
      <AccountHeading
        icon={Heart}
        title={t("favoritesTitle")}
        body={
          waiting
            ? t("favoritesWaitingCount")
            : `${number(items.length)} ${t("savedWorks")}`
        }
        action={
          !waiting && !sharedSlugs?.length && favorites.length > 0 ? (
            <button type="button" className="account-button account-button--quiet" onClick={share}>
              <Share2 aria-hidden="true" strokeWidth={1.6} />
              {shared ? t("linkCopied") : t("shareList")}
            </button>
          ) : null
        }
      />
      {waiting ? (
        <div className="favorites-state is-waiting" role="status" aria-live="polite">
          <Heart aria-hidden="true" strokeWidth={1.6} />
          <h2>{t("favoritesWaitingTitle")}</h2>
          <p>{t("favoritesWaitingBody")}</p>
        </div>
      ) : items.length ? (
        <div className="product-grid">
          {items.map(
            (item) => item && <ProductCard key={item.slug} product={item} />,
          )}
        </div>
      ) : (
        <EmptyFavoritesState suggestions={availableWorks(products)} />
      )}
    </section>
  );

  if (sharedSlugs?.length) return content;
  return <AccountShell>{content}</AccountShell>;
}
