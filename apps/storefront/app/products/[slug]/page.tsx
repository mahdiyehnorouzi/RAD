import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ProductDetail } from "@/components/product";
import { fetchFaq, fetchProductReviews } from "@/lib/api";
import { productFromArtwork, resolveArtwork } from "@/lib/artworks";
import { displayWorks } from "@/lib/catalog/get-catalog-works";
import { isUpcomingStatus } from "@/lib/catalog/product-status";
import { isPurchasableStatus } from "@rad/types";
import {
  breadcrumbJsonLd,
  faqPageJsonLd,
  languageAlternates,
  productJsonLd,
  safeJsonLd,
  siteName,
} from "@/lib/seo";

/** Only works offered in the shop have a product page; the rest live on their passport. */
const resolveProduct = cache(async (slug: string) => {
  const artwork = await resolveArtwork(slug);
  if (!artwork || artwork.slug !== slug || artwork.price === null) return null;
  return productFromArtwork(artwork);
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await resolveProduct(slug).catch(() => undefined);
  if (product === undefined)
    return { title: siteName, robots: { index: false, follow: false } };
  if (!product)
    return { title: "اثر پیدا نشد", robots: { index: false, follow: false } };

  const title = product.name;
  const description = `${product.subtitle}؛ ${product.story}`.slice(0, 160);
  const path = `/products/${product.slug}`;
  const image = product.images?.find((item) => item.src)?.src;

  return {
    title,
    description,
    alternates: {
      canonical: path,
      languages: languageAlternates(path),
    },
    openGraph: {
      type: "website",
      locale: "fa_IR",
      alternateLocale: ["en_US"],
      siteName,
      title,
      description,
      url: path,
      images: image
        ? [{ url: image, alt: product.images?.[0]?.alt || title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export function generateStaticParams() {
  return displayWorks.map((product) => ({ slug: product.slug }));
}

export default async function PDP({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await resolveProduct(slug);
  if (!product) notFound();

  const [faq, reviews] = await Promise.all([
    fetchFaq("fa"),
    fetchProductReviews(product.slug).catch(() => []),
  ]);

  const availability = isPurchasableStatus(product.status)
    ? "InStock"
    : isUpcomingStatus(product.status)
      ? "PreOrder"
      : "OutOfStock";
  const productSchema = productJsonLd(product, {
    availability,
    reviews,
  });
  const breadcrumbs = breadcrumbJsonLd([
    { name: "خانه", path: "/" },
    { name: "آثار", path: "/products" },
    { name: product.name, path: `/products/${product.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbs) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqPageJsonLd(faq)) }}
      />
      <ProductDetail product={product} initialFaq={faq} />
    </>
  );
}
