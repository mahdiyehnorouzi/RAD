import type { Metadata } from "next";
import { CatalogScope } from "@/components/catalog/catalog-scope";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = privatePageMetadata;

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CatalogScope>{children}</CatalogScope>;
}
