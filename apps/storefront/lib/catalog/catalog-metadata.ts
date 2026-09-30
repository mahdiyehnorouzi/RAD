import type { Metadata } from "next";
import type { Product } from "@rad/types";
import { categoryLabel } from "@/lib/catalog/artwork";
import {
  catalogHref,
  defaultCatalogFilters,
  type CatalogFilters,
} from "@/lib/catalog/filters";
import { catalogArtists } from "@/lib/catalog/refine";
import { pageMetadata } from "@/lib/seo";

const baseTitle = "خرید آثار هنری یکتا";
const baseDescription =
  "مجموعه آثار هنری تک‌نسخه از هنرمندان مستقل؛ سفال و سرامیک، نقاشی، مجسمه، بافت، چوب و زیورآلات هنری.";

/**
 * Category and artist are landing pages worth indexing. Status, price and sort
 * only narrow or reorder them, so they share the landing page's canonical URL.
 */
function catalogLandingFilters(filters: CatalogFilters): CatalogFilters {
  return {
    ...defaultCatalogFilters,
    category: filters.category,
    artist: filters.artist,
  };
}

export function catalogMetadata(
  filters: CatalogFilters,
  products: Product[],
): Metadata {
  const category =
    filters.category === "all" ? null : categoryLabel(filters.category, "fa");
  const artist =
    filters.artist === "all"
      ? null
      : catalogArtists(products).find((item) => item.key === filters.artist)
          ?.name.fa;

  const title =
    category && artist
      ? `${category} اثر ${artist}`
      : category
        ? `خرید ${category} یکتا`
        : artist
          ? `آثار ${artist}`
          : baseTitle;
  const description =
    category || artist
      ? `${[category, artist ? `اثر ${artist}` : null].filter(Boolean).join(" ")}؛ آثار تک‌نسخه و دست‌ساز در رَد.`
      : baseDescription;

  const metadata = pageMetadata({
    title,
    description,
    path: catalogHref(catalogLandingFilters(filters)),
  });
  // Free-text results are unbounded; keep them out of the index but let crawlers follow the works.
  return filters.query.trim()
    ? { ...metadata, robots: { index: false, follow: true } }
    : metadata;
}
