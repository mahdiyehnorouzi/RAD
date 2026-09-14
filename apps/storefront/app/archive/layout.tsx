import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "آرشیو رَد",
  description: "تمام رَدهایی که تا امروز وجود داشته‌اند؛ فروخته‌شده‌ها ناپدید نمی‌شوند.",
  path: "/archive",
});

export default function ArchiveLayout({ children }: { children: React.ReactNode }) {
  return children;
}
