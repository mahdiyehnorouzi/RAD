import type { Metadata } from "next";
import "./globals.css";
import "@/components/ui/button-link.css";
import "@/components/ui/section.css";
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
import { CatalogProvider } from "@/components/catalog";
import { HomeBanner } from "@/components/home";

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
              <MakingProvider>
                <CartProvider>
                  <RouteScrollReset />
                  <HomeBanner />
                  <Header />
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
