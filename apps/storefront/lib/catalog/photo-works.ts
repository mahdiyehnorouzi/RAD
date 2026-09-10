import type { Product, ProductCategory, ProductShape, ProductStatus } from "@rad/types";
import { formatToman } from "@/lib/money";
import { photoProducts } from "./photo-products-data";
import { radStudio } from "./vendors";

export function catalogPhotoSrc(slug: string, imageIndex = 0) {
  const suffix = imageIndex === 0 ? "" : `-${imageIndex + 1}`;
  return `/catalog/photos/transparent/${slug}${suffix}.png`;
}

export const catalogPhotoSlugs = new Set(photoProducts.map((product) => product.slug));

export const photoWorks: Product[] = photoProducts.map((product, index) => {
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
    artworkNumber: `RAD-${String(index + 27).padStart(3, "0")}`,
    vendor: radStudio,
    images: product.images.map((image, imageIndex) => ({
        src: catalogPhotoSrc(product.slug, imageIndex),
        alt: image.alt,
        enAlt: image.enAlt,
        color: product.color,
        accent: product.accent,
        shape: product.shape as ProductShape,
      })),
    en: product.en,
  };
});
