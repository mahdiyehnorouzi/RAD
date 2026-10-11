import { getCatalog } from "@/lib/catalog/get-catalog-works";
import { CatalogProvider } from "./catalog-provider";

/**
 * Server wrapper for routes whose client components look works up by slug.
 * Kept out of the feature barrel: client files import that barrel, and this
 * one reads the server-only catalog.
 */
export async function CatalogScope({
  withArtworks = false,
  children,
}: {
  /** Also pass full artworks (passports, portraits); most routes need only products. */
  withArtworks?: boolean;
  children: React.ReactNode;
}) {
  const { products, artworks, origin } = await getCatalog();
  return (
    <CatalogProvider
      products={products}
      artworks={withArtworks ? artworks : undefined}
      live={origin === "api"}
    >
      {children}
    </CatalogProvider>
  );
}
