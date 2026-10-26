import { getCatalog } from "@/lib/catalog/get-catalog-works";
import { commerceProducts } from "@/lib/artworks/product";
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
  const { artworks, origin } = await getCatalog();
  return (
    <CatalogProvider
      products={commerceProducts(artworks)}
      artworks={withArtworks ? artworks : undefined}
      live={origin === "api"}
    >
      {children}
    </CatalogProvider>
  );
}
