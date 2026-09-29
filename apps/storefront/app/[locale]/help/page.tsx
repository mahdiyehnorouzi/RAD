import { HelpHub } from "@/components/help";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "راهنمای خرید و قوانین",
  description:
    "خرید آثار آماده، سفارش اختصاصی، ارسال و تحویل، مرجوعی و آسیب؛ قوانین رَد به زبان ساده، به‌همراه شرایط استفاده و حریم خصوصی.",
  path: "/help",
});

export default function HelpRoute() {
  return <HelpHub />;
}
