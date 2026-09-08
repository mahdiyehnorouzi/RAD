import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "خرید آثار هنری یکتا",
  description:
    "مجموعه آثار هنری تک‌نسخه از هنرمندان مستقل؛ سفال و سرامیک، نقاشی، مجسمه، بافت، چوب و زیورآلات هنری.",
  path: "/products",
});

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
