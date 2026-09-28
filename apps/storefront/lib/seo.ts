import type { Metadata } from "next";
import type { FaqContent, Product, Review } from "@rad/types";
import type { SchemaAvailability } from "@/lib/catalog/product-seo";

const FALLBACK_SITE_URL = "https://www.rad-object.com";

export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || FALLBACK_SITE_URL,
);

export const siteName = "رَد — آثار یکتای هنری";
export const defaultDescription =
  "خرید آثار هنری یکتا و ثبت سفارش شخصی از هنرمندان مستقل؛ سفال و سرامیک، نقاشی، مجسمه، بافت و زیورآلات هنری.";

export function absoluteUrl(path = "/") {
  return new URL(path, siteUrl).toString();
}

/** hreflang alternates for FA default + EN via `?lang=en`. */
export function languageAlternates(path: string) {
  const enPath = path.includes("?")
    ? `${path}&lang=en`
    : path === "/"
      ? "/?lang=en"
      : `${path}?lang=en`;
  return {
    "fa-IR": path,
    en: enPath,
    "x-default": path,
  } as const;
}

export function pageMetadata({
  title,
  description,
  path,
  image,
  type = "website",
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
}): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path,
      languages: languageAlternates(path),
    },
    openGraph: {
      type,
      locale: "fa_IR",
      alternateLocale: ["en_US"],
      siteName,
      title,
      description,
      url: path,
      ...(image
        ? { images: [{ url: image, alt: title }] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export const privatePageMetadata: Metadata = {
  robots: { index: false, follow: false, noarchive: true },
};

/**
 * 404 boundaries merge with the layouts above them, so a missing
 * `/products/x` would otherwise inherit `/products`' canonical and OG URL.
 */
export function notFoundMetadata(
  title = "صفحه پیدا نشد",
  description = "این صفحه در رَد وجود ندارد.",
): Metadata {
  return {
    ...privatePageMetadata,
    title: { absolute: `${title} | رَد` },
    description,
    alternates: null,
    openGraph: null,
    twitter: null,
  };
}

export function safeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function productListJsonLd(products: Product[], path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    url: absoluteUrl(path),
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/products/${product.slug}`),
      name: product.name,
    })),
  };
}

export function breadcrumbJsonLd(
  crumbs: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export function faqPageJsonLd(faq: FaqContent) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function productJsonLd(
  product: Product,
  options: {
    availability: SchemaAvailability;
    priceToman: number;
    passportPath?: string;
    reviews?: Review[];
  },
) {
  const path = `/products/${product.slug}`;
  const images = (product.images ?? [])
    .map((item) => item.src)
    .filter((src): src is string => Boolean(src))
    .map(absoluteUrl);
  const reviews = options.reviews ?? [];
  const ratingSum = reviews.reduce((sum, review) => sum + review.rating, 0);
  const aggregateRating =
    reviews.length > 0
      ? {
          "@type": "AggregateRating",
          ratingValue: Number((ratingSum / reviews.length).toFixed(2)),
          reviewCount: reviews.length,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${absoluteUrl(path)}#product`,
    name: product.name,
    alternateName: product.en.name,
    description: `${product.subtitle}. ${product.story}`,
    sku: product.artworkNumber || product.slug,
    category: product.category,
    image: images.length ? images : undefined,
    url: absoluteUrl(path),
    brand: { "@type": "Brand", name: "رَد", alternateName: "RĀD" },
    seller: { "@id": `${absoluteUrl()}#organization` },
    ...(options.passportPath
      ? { subjectOf: { "@id": `${absoluteUrl(options.passportPath)}#passport` } }
      : {}),
    offers: {
      "@type": "Offer",
      url: absoluteUrl(path),
      // ISO 4217 has no Toman; 1 Toman = 10 IRR.
      priceCurrency: "IRR",
      price: options.priceToman * 10,
      availability: `https://schema.org/${options.availability}`,
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": `${absoluteUrl()}#organization` },
    },
    ...(aggregateRating ? { aggregateRating } : {}),
    ...(reviews.length
      ? {
          review: reviews.slice(0, 10).map((review) => ({
            "@type": "Review",
            author: { "@type": "Person", name: review.author },
            datePublished: new Date(review.createdAt).toISOString(),
            reviewBody: review.comment,
            reviewRating: {
              "@type": "Rating",
              ratingValue: review.rating,
              bestRating: 5,
              worstRating: 1,
            },
          })),
        }
      : {}),
  };
}
