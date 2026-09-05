import type { Product, ProductCategory, ProductShape, ProductStatus } from "@rad/types";
import { formatToman } from "@/lib/money";
import { photoProducts } from "./photo-products-data";

const guestArtist = {
  id: "artist-sahar",
  displayName: "سحر میرزایی",
  displayNameEn: "Sahar Mirzaei",
  kind: "guest_artist" as const,
  verified: true,
};

export function catalogPhotoSrc(slug: string) {
  return `/catalog/photos/${slug}.webp`;
}

export function hasRealProductImage(product: Product) {
  return Boolean(
    product.images?.some(
      (image) =>
        image.src &&
        !image.src.includes("rad-icon") &&
        (image.src.startsWith("/catalog/") ||
          image.src.startsWith("/backend/") ||
          image.src.startsWith("http") ||
          image.src.startsWith("data:")),
    ),
  );
}

export const photoWorks: Product[] = photoProducts.map((product) => {
  const image = product.images[0];
  return {
    slug: product.slug,
    name: product.name,
    subtitle: product.subtitle,
    price: formatToman(product.tomanPrice),
    usdPrice: product.usdPrice,
    color: product.color,
    accent: product.accent,
    shape: product.shape as ProductShape,
    category: product.category as ProductCategory,
    status: product.status as ProductStatus,
    story: product.story,
    details: product.details,
    vendor: guestArtist,
    images: [
      {
        src: catalogPhotoSrc(product.slug),
        alt: image.alt,
        enAlt: image.enAlt,
        color: product.color,
        accent: product.accent,
        shape: product.shape as ProductShape,
      },
    ],
    en: product.en,
  };
});
