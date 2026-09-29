import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "نظر مشتریان رَد",
  description:
    "تجربهٔ واقعی کسانی که اثری از رَد خریده یا سفارش داده‌اند؛ با عکس همان اثر.",
  path: "/reviews",
});

export default function ReviewsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
