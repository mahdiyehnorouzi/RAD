import type { Metadata } from "next";
import { CatalogScope } from "@/components/catalog/catalog-scope";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "رَد من چه شکلیه؟",
  description: "چند سؤال کوتاه؛ بعد سه رَد واقعی از آرشیو.",
  path: "/shape",
});

export default function ShapeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CatalogScope withArtworks>{children}</CatalogScope>;
}
