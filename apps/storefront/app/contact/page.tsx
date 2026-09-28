import { ContactPage } from "@/components/contact";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "حرف بزنیم",
  description:
    "با رَد حرف بزن؛ درباره‌ی یک اثر، ایده‌ای برای سفارش اختصاصی، یا پرداخت و پیگیری سفارشی که ثبت کرده‌ای.",
  path: "/contact",
});

export default function ContactRoute() {
  return <ContactPage />;
}
