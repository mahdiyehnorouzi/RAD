import {
  formatRadCode,
  visualForCategory,
  type Artwork,
  type Locale,
  type Product,
} from "@rad/types";
import { hasRealProductImage } from "@/lib/catalog/category-defaults";
import { formatToman } from "@/lib/money";

function detailLines(artwork: Artwork, locale: Locale) {
  const lines = [
    artwork.dimensions,
    artwork.materials.body,
    artwork.materials.surface,
  ]
    .filter((line): line is NonNullable<typeof line> => Boolean(line))
    .map((line) => line[locale]);
  return [...lines, locale === "fa" ? "تنها یک نسخه" : "One of one"];
}

/** Commerce view of an artwork: cart, checkout, cards and orders read this. */
export function productFromArtwork(artwork: Artwork): Product {
  return {
    slug: artwork.slug,
    name: artwork.title.fa,
    subtitle: artwork.description.fa,
    price: artwork.price === null ? "" : formatToman(artwork.price),
    usdPrice: artwork.usdPrice ?? 0,
    color: artwork.color,
    accent: artwork.accent,
    shape: artwork.shape,
    category: artwork.category,
    visual: visualForCategory(artwork.category),
    status: artwork.status,
    reservedUntil: artwork.reservedUntil,
    story: artwork.story.fa,
    details: detailLines(artwork, "fa"),
    images: artwork.images,
    vendor: {
      id: artwork.artist.id,
      displayName: artwork.artist.name.fa,
      displayNameEn: artwork.artist.name.en,
      kind: artwork.artist.kind,
      verified: artwork.artist.verified,
    },
    radNumber: artwork.radNumber ?? undefined,
    artworkNumber: artwork.radNumber
      ? `RAD-${formatRadCode(artwork.radNumber)}`
      : undefined,
    listedAt: artwork.createdAt,
    en: {
      name: artwork.title.en,
      subtitle: artwork.description.en,
      story: artwork.story.en,
      details: detailLines(artwork, "en"),
    },
  };
}

/** Works the shop lists: offered for sale and photographed. */
export function shopProducts(artworks: Artwork[]): Product[] {
  return artworks
    .filter((artwork) => artwork.price !== null)
    .map(productFromArtwork)
    .filter(hasRealProductImage);
}
