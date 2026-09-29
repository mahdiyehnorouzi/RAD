import type { Product } from "@rad/types";
import { isPurchasableStatus } from "@rad/types";
import {
  isFileProductImage,
  productPhotoSrc,
} from "@/lib/catalog/category-defaults";
import { isGoneStatus } from "@/lib/catalog/product-status";
import {
  catalogLifestylePhotoSrc,
  hasStudioPhotos,
} from "@/lib/catalog/photo-works";

/** One wide featured plate beside a card, then a full row of three. */
const FEATURED_LIMIT = 5;

export function featuredHomeWorks(products: Product[]): Product[] {
  const available = products.filter((product) =>
    isPurchasableStatus(product.status),
  );
  const pool = available.length
    ? available
    : products.filter((product) => !isGoneStatus(product.status));
  const scarce = products.find((product) => isGoneStatus(product.status));
  if (!scarce) return pool.slice(0, FEATURED_LIMIT);
  return [...pool.slice(0, FEATURED_LIMIT - 1), scarce];
}

export function featuredWorkPhoto(product?: Product) {
  if (product && hasStudioPhotos(product)) {
    return catalogLifestylePhotoSrc(product.slug);
  }
  const src = product?.images?.[0]?.src;
  if (isFileProductImage(src)) {
    const photo = productPhotoSrc(src);
    if (photo) return photo;
  }
  return "/home/hero/work-02-stone-lamp.webp";
}
