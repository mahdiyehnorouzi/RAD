import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "سفارش اثر هنری شخصی",
  description:
    "ایده‌تان را به یک اثر هنری یکتا تبدیل کنید؛ مسیر سفارش شخصی رَد برای همکاری مستقیم با هنرمندان مستقل.",
  path: "/studio",
});

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
