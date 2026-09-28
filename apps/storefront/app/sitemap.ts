import type { MetadataRoute } from "next";
import { loadCatalogWorks } from "@/lib/catalog/get-catalog-works";
import { portraitsFrom } from "@/lib/difference";
import { livePiecesFrom } from "@/lib/now";
import { passportsFrom } from "@/lib/passport";
import { CURRENT_POLICY_VERSIONS, POLICY_SLUGS } from "@rad/types";
import { absoluteUrl } from "@/lib/seo";
import { artworkCategories } from "@/lib/catalog/artwork";
import {
  catalogHref,
  defaultCatalogFilters,
  type CatalogFilters,
} from "@/lib/catalog/filters";
import { catalogArtists, shopFloor } from "@/lib/catalog/refine";
import { PRODUCT_SEO, productSeoState } from "@/lib/catalog/product-seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { artworks, products } = await loadCatalogWorks();
  const lastModified = new Date();
  const shelf = shopFloor(products);
  const catalogLandings: CatalogFilters[] = [
    ...[...new Set(shelf.map((product) => product.category))]
      .filter((category) => artworkCategories.some((item) => item.id === category))
      .map((category) => ({ ...defaultCatalogFilters, category })),
    ...catalogArtists(shelf).map((artist) => ({
      ...defaultCatalogFilters,
      artist: artist.key,
    })),
  ];

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl(), lastModified, changeFrequency: "weekly", priority: 1 },
    {
      url: absoluteUrl("/about"),
      lastModified,
      changeFrequency: "yearly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/contact"),
      lastModified,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: absoluteUrl("/help"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...POLICY_SLUGS.map((slug) => ({
      url: absoluteUrl(`/help/${slug}`),
      lastModified: new Date(`${CURRENT_POLICY_VERSIONS[slug]}T00:00:00Z`),
      changeFrequency: "yearly" as const,
      priority: 0.4,
    })),
    {
      url: absoluteUrl("/products"),
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/studio"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/differences"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/passport"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/archive"),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/now"),
      lastModified,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/shape"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  return [
    ...staticRoutes,
    ...catalogLandings.map((filters) => ({
      url: absoluteUrl(catalogHref(filters)),
      lastModified,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...livePiecesFrom(artworks).map((piece) => ({
      url: absoluteUrl(`/now/${piece.code}`),
      lastModified,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...products.flatMap((product) => {
      const sitemap = PRODUCT_SEO[productSeoState(product)].sitemap;
      if (!sitemap) return [];
      return {
        url: absoluteUrl(`/products/${product.slug}`),
        lastModified,
        ...sitemap,
        images: product.images
          ?.map((image) => image.src)
          .filter((src): src is string => Boolean(src))
          .map(absoluteUrl),
      };
    }),
    ...portraitsFrom(artworks).map((portrait) => ({
      url: absoluteUrl(`/differences/${portrait.id}`),
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.6,
      images: portrait.stageImages
        ? Object.values(portrait.stageImages).map(absoluteUrl)
        : undefined,
    })),
    ...passportsFrom(artworks).map((passport) => ({
      url: absoluteUrl(`/passport/${passport.code}`),
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.6,
      images: passport.finalPhotos.map((photo) => absoluteUrl(photo.src)),
    })),
  ];
}
