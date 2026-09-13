import type { Product } from "@rad/types";
import { fetchProducts } from "@/lib/api";
import {
  hasRealProductImage,
  overlayLiveCatalog,
} from "@/lib/catalog/category-defaults";
import { photoWorks } from "@/lib/catalog/photo-works";
import { mockProducts } from "@/lib/catalog/products";

const categorySampleWorks = mockProducts.filter(hasRealProductImage);

export const displayWorks: Product[] = [...photoWorks, ...categorySampleWorks];

export async function getCatalogWorks(): Promise<Product[]> {
  try {
    const remote = await fetchProducts();
    const list = Array.isArray(remote) ? remote : [];
    return list.length ? overlayLiveCatalog(displayWorks, list) : displayWorks;
  } catch {
    return displayWorks;
  }
}
