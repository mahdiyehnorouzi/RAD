import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "گذرنامه رَد",
  description:
    "هر رَد فقط یک‌بار ساخته شده. مسیر، ماده، دست و جایی که حالا هست را اینجا می‌بینی.",
  path: "/passport",
});

export default function PassportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
