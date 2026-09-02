import type { Metadata } from "next";
import "./globals.css";
import { mockStorefront } from "@/lib/mock-data";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PageBackNavigation } from "@/components/layout/page-back-navigation";
import { CartProvider } from "@/components/cart/cart-provider";
import { LocaleProvider } from "@/components/i18n";
import { CommerceProvider } from "@/components/commerce/commerce-provider";
import { CatalogProvider } from "@/components/catalog-provider";
import { RouteScrollReset } from "@/components/route-scroll-reset";
import { HomeBanner } from "@/components/home-banner";

export const metadata: Metadata = {
  title: mockStorefront.brand.title.fa,
  description: mockStorefront.brand.description.fa,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <LocaleProvider>
          <CatalogProvider>
            <CommerceProvider>
              <CartProvider>
                <RouteScrollReset />
                <HomeBanner />
                <Header />
                <PageBackNavigation />
                <main>{children}</main>
                <Footer />
              </CartProvider>
            </CommerceProvider>
          </CatalogProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
