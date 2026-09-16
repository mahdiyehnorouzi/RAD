import type { Metadata } from "next";
import "./globals.css";
import "@/components/ui/button-link.css";
import "@/components/ui/section.css";
import "@/components/ui/skeleton.css";
import { mockStorefront } from "@/lib/catalog/mock-storefront";
import {
  Footer,
  GoogleAnalytics,
  Header,
  PageBackNavigation,
  RouteScrollReset,
} from "@/components/layout";
import { CartProvider } from "@/components/cart";
import { LocaleProvider } from "@/components/i18n";
import { CommerceProvider } from "@/components/commerce";
import { MakingProvider } from "@/hooks/use-making-workspace";
import { CatalogProvider } from "@/components/catalog/catalog-provider";
import { HomeBanner } from "@/components/home/home-banner";
import {
  absoluteUrl,
  defaultDescription,
  languageAlternates,
  safeJsonLd,
  siteName,
  siteUrl,
} from "@/lib/seo";

const googleVerification =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ||
  process.env.GOOGLE_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: mockStorefront.brand.title.fa,
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
    title: mockStorefront.brand.title.fa,
    description: defaultDescription,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: mockStorefront.brand.title.fa,
    description: defaultDescription,
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
    icon: [{ url: "/rad-logo.png", type: "image/png" }, { url: "/rad-icon.svg", type: "image/svg+xml" }],
    apple: "/rad-logo.png",
    shortcut: "/rad-logo.png",
  },
  ...(googleVerification
    ? { verification: { google: googleVerification } }
    : {}),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const gaEnabled = Boolean(
    gaMeasurementId && /^G-[A-Z0-9]+$/i.test(gaMeasurementId),
  );

  return (
    <html lang="fa" dir="rtl">
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
        <LocaleProvider>
          <CatalogProvider>
            <CommerceProvider>
              <MakingProvider>
                <CartProvider>
                  {gaEnabled && gaMeasurementId ? (
                    <GoogleAnalytics measurementId={gaMeasurementId} />
                  ) : null}
                  <RouteScrollReset />
                  <HomeBanner />
                  <Header />
                  {/* <PwaRegistrar /> */}
                  <PageBackNavigation />
                  <main>{children}</main>
                  <Footer />
                </CartProvider>
              </MakingProvider>
            </CommerceProvider>
          </CatalogProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
