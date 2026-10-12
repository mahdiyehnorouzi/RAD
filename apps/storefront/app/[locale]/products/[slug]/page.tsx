import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ProductDetail } from "@/features/product-detail";
import { fetchProductReviews } from "@/lib/api";
import { registryProducts } from "@/lib/catalog/get-catalog-works";
import { resolvePdpData, resolveWork } from "@/lib/catalog/resolve-pdp-data";
import {
  PRODUCT_SEO,
  productSeoDescription,
  productSeoState,
  productSeoTitle,
} from "@/lib/catalog/product-seo";
import {
  breadcrumbJsonLd,
  defaultOgImage,
  faqPageJsonLd,
  languageAlternates,
  productJsonLd,
  safeJsonLd,
  siteName,
} from "@/lib/seo";
import { recover } from "@/lib/log";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const work = await resolveWork(slug).catch(
    recover(`product ${slug}`, undefined),
  );
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
      images: [
        {
          url: image?.src || defaultOgImage(),
          alt: image?.alt || product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image?.src || defaultOgImage()],
    },
  };
}

export function generateStaticParams() {
  return registryProducts().map((product) => ({ slug: product.slug }));
}

export default async function PDP({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Single source of truth for PDP data — the card-click overlay's data
  // endpoint (app/api/pdp/[slug]/route.ts) calls the exact same
  // `resolvePdpData`, so the two render paths can never diverge in what
  // product/artwork/passport/related/FAQ content they show.
  //
  // Reviews don't depend on resolvePdpData's result — resolveWork() only
  // ever returns `kind: "product"` when `artwork.slug === slug`, so the
  // route's own slug is already the canonical one whenever `data` isn't
  // `moved`/null — so the two fetches run in parallel instead of one full
  // round trip after the other. The tradeoff: an unused reviews fetch fires
  // for the rarer not-found/moved cases, where it's simply discarded below.
  const [data, reviews] = await Promise.all([
    resolvePdpData(slug),
    fetchProductReviews(slug).catch(recover(`reviews ${slug}`, [])),
  ]);
  if (!data) notFound();
  if ("moved" in data) redirect(data.moved);

  const { product, artwork, priceToman, passport, passportPath, qrSvg, related, faq } =
    data;

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
        passport={passport}
        related={related}
        initialFaq={faq}
        qrSvg={qrSvg}
      />
    </>
  );
}
