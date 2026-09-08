import type { Product } from "@rad/types";
import { isFileProductImage, productPhotoSrc } from "@/lib/catalog/category-defaults";
import { catalogPhotoSlugs, catalogPhotoSrc } from "@/lib/catalog/photo-works";

const FEATURED_LIMIT = 4;

function isScarce(product: Product) {
  return product.status === "sold" || product.status === "reserved";
}

export function featuredHomeWorks(products: Product[]): Product[] {
  const available = products.filter((product) => !isScarce(product));
  const scarce = products.find(isScarce);
  if (!scarce) return available.slice(0, FEATURED_LIMIT);
  return [...available.slice(0, FEATURED_LIMIT - 1), scarce];
}

export function featuredWorkPhoto(product?: Product) {
  const src = product?.images?.[0]?.src;
  if (isFileProductImage(src)) {
    const photo = productPhotoSrc(src);
    if (photo) return photo;
  }
  if (product && catalogPhotoSlugs.has(product.slug)) return catalogPhotoSrc(product.slug);
  return "/home/polaroid/alabaster-walnut-lamp.png";
}
