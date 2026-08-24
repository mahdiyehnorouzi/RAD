import type { Metadata } from "next";
import "./globals.css";
import { Header, Footer } from "@/components/site";
import { CartProvider } from "@/components/cart";
import { LocaleProvider } from "@/components/i18n";
import { CommerceProvider } from "@/components/commerce";
import { RouteScrollReset } from "@/components/route-scroll-reset";
export const metadata: Metadata = {
  title: "رَد — استودیو سرامیک",
  description: "آثار یگانه و سرامیک سفارشی، ساخته‌شده در تهران",
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
          <CommerceProvider>
            <CartProvider>
              <RouteScrollReset />
              <Header />
              <main>{children}</main>
              <Footer />
            </CartProvider>
          </CommerceProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
