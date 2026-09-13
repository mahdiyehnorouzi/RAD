import type { MetadataRoute } from "next";
import { mockProducts } from "@/lib/catalog/products";
import { photoWorks } from "@/lib/catalog/photo-works";
import { museumPortraits } from "@/lib/difference";
import { livePieces } from "@/lib/now";
import { radPassports } from "@/lib/passport";
import { absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const products = [...photoWorks, ...mockProducts].filter(
    (product, index, all) =>
      product.status !== "draft" &&
      all.findIndex((candidate) => candidate.slug === product.slug) === index,
  );

  return [
    { url: absoluteUrl(), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/about"), changeFrequency: "yearly", priority: 0.7 },
    { url: absoluteUrl("/products"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/studio"), changeFrequency: "monthly", priority: 0.7 },
    {
      url: absoluteUrl("/differences"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/passport"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/archive"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/now"),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/shape"),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...livePieces.map((piece) => ({
      url: absoluteUrl(`/now/${piece.code}`),
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...products.map((product) => ({
      url: absoluteUrl(`/products/${product.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: product.images
        ?.map((image) => image.src)
        .filter((src): src is string => Boolean(src))
        .map(absoluteUrl),
    })),
    ...museumPortraits.map((portrait) => ({
      url: absoluteUrl(`/differences/${portrait.id}`),
      changeFrequency: "yearly" as const,
      priority: 0.6,
      images: portrait.stageImages
        ? Object.values(portrait.stageImages).map(absoluteUrl)
        : undefined,
    })),
    ...radPassports.map((passport) => ({
      url: absoluteUrl(`/passport/${passport.code}`),
      changeFrequency: "yearly" as const,
      priority: 0.6,
      images: passport.finalPhotos.map((photo) => absoluteUrl(photo.src)),
    })),
  ];
}
