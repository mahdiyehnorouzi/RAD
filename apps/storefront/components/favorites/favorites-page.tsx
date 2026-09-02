"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ProductCard, ProductGrid } from "@/components/product";
import { Button } from "@/components/ui/button-link";
import { EmptyState, Eyebrow, PageSection } from "@/components/ui/section";
import { useCatalog } from "@/components/catalog/catalog-provider";
import { useCommerce } from "@/components/commerce/commerce-provider";
import { useLocale } from "@/components/i18n";

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
    [slugs, getProduct],
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
    <PageSection>
      <header className="mb-10 flex items-end justify-between gap-4">
        <div>
          <Eyebrow>
            {sharedSlugs?.length
              ? t("sharedListEyebrow")
              : t("favoriteEyebrow")}
          </Eyebrow>
          <h1 className="m-0 text-h2 font-normal">{t("favoritesTitle")}</h1>
          <p>
            {number(items.length)} {t("savedWorks")}
          </p>
        </div>
        {!sharedSlugs?.length && favorites.length > 0 && (
          <Button type="button" variant="outline" onClick={share}>
            {shared ? t("linkCopied") : t("shareList")}
          </Button>
        )}
      </header>
      {items.length ? (
        <ProductGrid>
          {items.map(
            (item, index) =>
              item && (
                <ProductCard key={item.slug} product={item} index={index} />
              ),
          )}
        </ProductGrid>
      ) : (
        <EmptyState
          title={t("emptyFavorites")}
          body={t("emptyFavoritesBody")}
        />
      )}
    </PageSection>
  );
}
