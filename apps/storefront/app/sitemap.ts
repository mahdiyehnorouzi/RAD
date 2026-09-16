import type { MetadataRoute } from "next";
import { getCatalogWorks } from "@/lib/catalog/get-catalog-works";
import { museumPortraits } from "@/lib/difference";
import { livePieces } from "@/lib/now";
import { radPassports } from "@/lib/passport";
import { absoluteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalog = await getCatalogWorks();
  const products = catalog.filter(
    (product, index, all) =>
      product.status !== "draft" &&
      product.status !== "review" &&
      all.findIndex((candidate) => candidate.slug === product.slug) === index,
  );
  const lastModified = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl(), lastModified, changeFrequency: "weekly", priority: 1 },
    {
      url: absoluteUrl("/about"),
      lastModified,
      changeFrequency: "yearly",
      priority: 0.7,
    },
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
    ...livePieces.map((piece) => ({
      url: absoluteUrl(`/now/${piece.code}`),
      lastModified,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...products.map((product) => ({
      url: absoluteUrl(`/products/${product.slug}`),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: product.images
        ?.map((image) => image.src)
        .filter((src): src is string => Boolean(src))
        .map(absoluteUrl),
    })),
    ...museumPortraits.map((portrait) => ({
      url: absoluteUrl(`/differences/${portrait.id}`),
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.6,
      images: portrait.stageImages
        ? Object.values(portrait.stageImages).map(absoluteUrl)
        : undefined,
    })),
    ...radPassports.map((passport) => ({
      url: absoluteUrl(`/passport/${passport.code}`),
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.6,
      images: passport.finalPhotos.map((photo) => absoluteUrl(photo.src)),
    })),
  ];
}
