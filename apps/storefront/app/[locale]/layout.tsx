import type { Metadata } from "next";
import dynamic from "next/dynamic";
import "../globals.css";
import "@/components/ui/button-link.css";
import "@/components/ui/section.css";
import "@/components/ui/skeleton.css";
import { brand } from "@/lib/brand";
import {
  DevDataBadge,
  Footer,
  GoogleAnalytics,
  Header,
  RouteScrollReset,
  RouteTrail,
} from "@/components/layout";
import { CartProvider } from "@/features/cart";
import { LocaleProvider } from "@/components/i18n";
import { CommerceProvider } from "@/components/commerce";
import { CatalogIndexProvider } from "@/components/catalog";
import { getCatalogIndex } from "@/lib/catalog/get-catalog-works";
import { HomeBanner } from "@/features/home/home-banner";
import {
  DEFAULT_LOCALE,
  LOCALES,
  isLocale,
  localeDirection,
} from "@/lib/locale";
import {
  absoluteUrl,
  defaultDescription,
  defaultOgImage,
  languageAlternates,
  safeJsonLd,
  siteName,
  siteUrl,
} from "@/lib/seo";

// Mounted once on every route (including the home page) but inert until a
// product card is clicked — see product-overlay.tsx. It pulls in the
// `motion` library and the full `ProductDetail` tree, none of which the
// initial paint needs, so it's code-split into its own chunk instead of
// shipping as part of every page's critical JS.
const ProductOverlay = dynamic(() =>
  import("@/features/product-detail").then((mod) => mod.ProductOverlay),
);

const googleVerification =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ||
  process.env.GOOGLE_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: brand.title.fa,
    template: "%s | رَد",
  },
  description: defaultDescription,
  applicationName: "رَد",
  authors: [{ name: "رَد" }],
  creator: "رَد",
  publisher: "رَد",
  category: "art",
  keywords: [
    "خرید آثار هنری",
    "آثار هنری یکتا",
    "هنرمندان مستقل",
    "سفال دست‌ساز",
    "سرامیک هنری",
    "نقاشی ایرانی",
    "سفارش اثر هنری",
    "گالری آنلاین هنر",
    "RAD studio",
    "unique artworks",
  ],
  alternates: {
    canonical: "/",
    languages: languageAlternates("/"),
  },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    alternateLocale: ["en_US"],
    siteName,
    title: brand.title.fa,
    description: defaultDescription,
    url: "/",
    images: [{ url: defaultOgImage(), width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: brand.title.fa,
    description: defaultDescription,
    images: [defaultOgImage()],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/rad-logo.png", type: "image/png" },
      { url: "/rad-icon.svg", type: "image/svg+xml" },
    ],
    apple: "/rad-logo.png",
    shortcut: "/rad-logo.png",
  },
  ...(googleVerification
    ? { verification: { google: googleVerification } }
    : {}),
};

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale: segment } = await params;
  // The 404 page renders this layout without a `locale` param.
  const locale = isLocale(segment) ? segment : DEFAULT_LOCALE;
  const catalogIndex = await getCatalogIndex();
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const gaEnabled = Boolean(
    gaMeasurementId && /^G-[A-Z0-9]+$/i.test(gaMeasurementId),
  );

  return (
    <html lang={locale} dir={localeDirection(locale)} data-locale={locale}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLd({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": `${absoluteUrl()}#organization`,
                  name: "رَد",
                  alternateName: "RAD",
                  url: absoluteUrl(),
                  logo: {
                    "@type": "ImageObject",
                    url: absoluteUrl("/rad-logo.png"),
                  },
                  description: defaultDescription,
                  sameAs: [],
                },
                {
                  "@type": "WebSite",
                  "@id": `${absoluteUrl()}#website`,
                  url: absoluteUrl(),
                  name: siteName,
                  description: defaultDescription,
                  inLanguage: ["fa-IR", "en"],
                  publisher: { "@id": `${absoluteUrl()}#organization` },
                },
              ],
            }),
          }}
        />
        <LocaleProvider locale={locale}>
          <CatalogIndexProvider entries={catalogIndex}>
            <CommerceProvider>
              <CartProvider>
                {gaEnabled && gaMeasurementId ? (
                  <GoogleAnalytics measurementId={gaMeasurementId} />
                ) : null}
                <RouteScrollReset />
                {/* Rendered first (own in-flow banner when the catalog
                    fell back to demo data) so its `position: sticky` sits
                    at the true top of the page, ahead of everything else,
                    rather than wherever it happened to mount in the tree. */}
                {process.env.NODE_ENV === "development" ? (
                  <DevDataBadge />
                ) : null}
                <HomeBanner />
                <Header />
                {/* <PwaRegistrar /> */}
                <RouteTrail />
                <main>{children}</main>
                <Footer />
                {/* Mounted once, globally: the card -> PDP expandable-card
                    overlay. Inert until a ProductCardStage click opens it —
                    the route underneath stays mounted the whole time. */}
                <ProductOverlay />
              </CartProvider>
            </CommerceProvider>
          </CatalogIndexProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
