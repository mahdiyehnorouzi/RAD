import type { Metadata } from "next";
import { CatalogScope } from "@/components/catalog/catalog-scope";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = privatePageMetadata;

/**
 * Do not statically prerender this route.
 *
 * `CatalogScope` is the only server-side work in /cart, and the page below
 * it is entirely client-rendered — nothing else forces dynamic rendering.
 * Left on defaults, `next build` prerenders this layout once, and if the
 * build-time catalog fetch fell back to the bundled registry (allowed
 * during `next build`; see `catalogSource()`), that registry snapshot gets
 * baked in as a permanently static page (`revalidate: false` in the
 * prerender manifest — no live fetch call was made, so Next has no
 * revalidate window to infer), served to every customer afterward
 * regardless of the real catalog. Request-time rendering always uses
 * `catalogSource() === "api"`; `getCatalog` still caches that fetch for 30s
 * under `CATALOG_TAG`. Same fix as the homepage (`app/[locale]/page.tsx`).
 */
export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CatalogScope>{children}</CatalogScope>;
}
