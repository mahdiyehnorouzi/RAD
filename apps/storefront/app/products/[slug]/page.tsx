import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ProductDetail } from "@/components/product";
import { fetchProduct } from "@/lib/api";
import { getProduct, mockProducts } from "@/lib/catalog/products";
import { photoWorks } from "@/lib/catalog/photo-works";
import {
  hasRealProductImage,
  overlayLiveProduct,
} from "@/lib/catalog/category-defaults";
import { absoluteUrl, safeJsonLd } from "@/lib/seo";
import { categoryLabel } from "@/lib/catalog/artwork";

const resolveProduct = cache(async (slug: string) => {
  const remote = await fetchProduct(slug).catch(() => null);
  const local =
    photoWorks.find((item) => item.slug === slug) ?? getProduct(slug);
  const visual = remote && hasRealProductImage(remote) ? remote : local ?? remote;
  return visual ? overlayLiveProduct(visual, remote ?? undefined) : null;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await resolveProduct(slug);
  if (!product) return { title: "اثر پیدا نشد", robots: { index: false, follow: false } };

  const title = product.name;
  const description = `${product.subtitle}؛ ${product.story}`.slice(0, 160);
  const path = `/products/${product.slug}`;
  const image = product.images?.find((item) => item.src)?.src;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "fa_IR",
      title,
      description,
      url: path,
      images: image ? [{ url: image, alt: product.images?.[0]?.alt || title }] : undefined,
    },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : undefined },
  };
}

export function generateStaticParams() {
  return [...photoWorks, ...mockProducts]
    .filter((product, index, all) => all.findIndex((item) => item.slug === product.slug) === index)
    .map((product) => ({ slug: product.slug }));
}

export default async function PDP({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await resolveProduct(slug);
  if (!product) notFound();
  const image = product.images?.find((item) => item.src)?.src;
  const availability = product.status === "sold" ? "OutOfStock" : "InStock";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${absoluteUrl(`/products/${product.slug}`)}#product`,
    name: product.name,
    alternateName: product.en.name,
    description: product.story,
    sku: product.artworkNumber || product.slug,
    category: categoryLabel(product.category, "fa"),
    image: image ? [absoluteUrl(image)] : undefined,
    url: absoluteUrl(`/products/${product.slug}`),
    brand: { "@type": "Brand", name: "رَد" },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/products/${product.slug}`),
      priceCurrency: "USD",
      price: product.usdPrice,
      availability: `https://schema.org/${availability}`,
      itemCondition: "https://schema.org/NewCondition",
    },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <ProductDetail product={product} />
    </>
  );
}
