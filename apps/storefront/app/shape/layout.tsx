import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "رَد من چه شکلیه؟",
  description: "پنج سؤال کوتاه؛ بعد سه رَد واقعی از آرشیو.",
  path: "/shape",
});

export default function ShapeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
