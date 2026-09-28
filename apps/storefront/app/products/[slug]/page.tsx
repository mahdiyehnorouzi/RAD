import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import QRCode from "qrcode";
import { formatRadCode, type Artwork, type Product } from "@rad/types";
import { ProductDetail } from "@/components/product";
import { fetchFaq, fetchProductReviews } from "@/lib/api";
import { productFromArtwork, resolveArtwork } from "@/lib/artworks";
import { displayWorks } from "@/lib/catalog/get-catalog-works";
import {
  PRODUCT_SEO,
  productSeoDescription,
  productSeoState,
  productSeoTitle,
} from "@/lib/catalog/product-seo";
import { passportFromArtwork } from "@/lib/passport";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  faqPageJsonLd,
  languageAlternates,
  productJsonLd,
  safeJsonLd,
  siteName,
} from "@/lib/seo";

type Work =
  | { kind: "moved"; to: string }
  | {
      kind: "product";
      product: Product;
      artwork: Artwork;
      priceToman: number;
      passportPath?: string;
    };

/**
 * Only works offered in the shop have a product page. A RAD number resolves to
 * its slug, and a work never offered for sale lives on its passport. Both are
 * temporary redirects: slugs and prices can still change.
 */
const resolveWork = cache(async (slug: string): Promise<Work | null> => {
  const artwork = await resolveArtwork(slug);
  if (!artwork) return null;
  const passport = passportFromArtwork(artwork);
  const passportPath = passport ? `/passport/${passport.code}` : undefined;
  if (artwork.price === null)
    return passportPath ? { kind: "moved", to: passportPath } : null;
  if (artwork.slug !== slug)
    return { kind: "moved", to: `/products/${artwork.slug}` };
  return {
    kind: "product",
    product: productFromArtwork(artwork),
    artwork,
    priceToman: artwork.price,
    passportPath,
  };
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const work = await resolveWork(slug).catch(() => undefined);
  if (work === undefined)
    return { title: siteName, robots: { index: false, follow: false } };
  if (!work)
    return { title: "اثر پیدا نشد", robots: { index: false, follow: false } };
  if (work.kind === "moved") return { robots: { index: false, follow: true } };

  const { product, priceToman } = work;
  const state = productSeoState(product);
  const title = productSeoTitle(product, state);
  const description = productSeoDescription(product, state, priceToman);
  const path = `/products/${product.slug}`;
  const image = product.images?.find((item) => item.src);

  return {
    title: { absolute: `${title} | رَد` },
    description,
    ...(PRODUCT_SEO[state].index
      ? {}
      : { robots: { index: false, follow: true } }),
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
      images: image?.src
        ? [{ url: image.src, alt: image.alt || product.name }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image?.src ? [image.src] : undefined,
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
  const work = await resolveWork(slug);
  if (!work) notFound();
  if (work.kind === "moved") redirect(work.to);

  const { product, artwork, priceToman, passportPath } = work;
  const qrTarget = absoluteUrl(
    product.radNumber
      ? `/r/${formatRadCode(product.radNumber)}`
      : `/products/${product.slug}`,
  );
  const [faq, reviews, qrSvg] = await Promise.all([
    fetchFaq("fa"),
    fetchProductReviews(product.slug).catch(() => []),
    QRCode.toString(qrTarget, {
      type: "svg",
      margin: 0,
      errorCorrectionLevel: "M",
      color: { dark: "#1a1714", light: "#00000000" },
    }).catch(() => undefined),
  ]);

  const productSchema = productJsonLd(product, {
    availability: PRODUCT_SEO[productSeoState(product)].availability,
    priceToman,
    passportPath,
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
      <ProductDetail
        product={product}
        artwork={artwork}
        initialFaq={faq}
        qrSvg={qrSvg}
      />
    </>
  );
}
