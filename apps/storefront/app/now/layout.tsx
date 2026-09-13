import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "الآن در کارگاه",
  description:
    "رَدهایی که همین حالا در کارگاه ساخته می‌شوند؛ از ایده تا کوره آخر.",
  path: "/now",
});

export default function NowLayout({ children }: { children: React.ReactNode }) {
  return children;
}
