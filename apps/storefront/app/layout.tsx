import type { Metadata } from "next";
import "./globals.css";
import { localFixes } from "./local-fixes";
import { mockStorefront } from "@/lib/mock-data";
import { Header, Footer, PageBackNavigation } from "@/components/site";
import { CartProvider } from "@/components/cart";
import { LocaleProvider } from "@/components/i18n";
import { CommerceProvider } from "@/components/commerce";
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
        <style dangerouslySetInnerHTML={{ __html: localFixes }} />
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
