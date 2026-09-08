import type { Metadata } from "next";
import "./globals.css";
import "@/components/ui/button-link.css";
import "@/components/ui/section.css";
import "@/components/ui/skeleton.css";
import { mockStorefront } from "@/lib/catalog/mock-storefront";
import {
  Footer,
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
  safeJsonLd,
  siteName,
  siteUrl,
} from "@/lib/seo";

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
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    siteName,
    title: mockStorefront.brand.title.fa,
    description: defaultDescription,
    url: "/",
    images: [{ url: "/rad-logo.png", width: 1254, height: 1254, alt: "نشان رَد" }],
  },
  twitter: {
    card: "summary_large_image",
    title: mockStorefront.brand.title.fa,
    description: defaultDescription,
    images: ["/rad-logo.png"],
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
    icon: "/rad-logo.png",
    apple: "/rad-logo.png",
    shortcut: "/rad-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
                  logo: absoluteUrl("/rad-logo.png"),
                  description: defaultDescription,
                },
                {
                  "@type": "WebSite",
                  "@id": `${absoluteUrl()}#website`,
                  url: absoluteUrl(),
                  name: siteName,
                  description: defaultDescription,
                  inLanguage: "fa-IR",
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
