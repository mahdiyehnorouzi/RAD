import type { Product, ProductCategory, ProductStatus } from "@rad/types";

const CATEGORY_DEFAULT_IMAGE: Record<ProductCategory, string> = {
  ceramics: "/catalog/defaults/ceramics.webp",
  vases: "/catalog/defaults/vases.webp",
  tableware: "/catalog/defaults/tableware.webp",
  sculpture: "/catalog/defaults/sculpture.webp",
  painting: "/catalog/defaults/painting.webp",
  textile: "/catalog/defaults/textile.webp",
  woodwork: "/catalog/defaults/woodwork.webp",
  jewelry: "/catalog/defaults/jewelry.webp",
  print: "/catalog/defaults/print.webp",
};

export function categoryDefaultImage(category: string) {
  return (
    CATEGORY_DEFAULT_IMAGE[category as ProductCategory] ??
    CATEGORY_DEFAULT_IMAGE.ceramics
  );
}

export function isFileProductImage(src?: string) {
  if (!src) return false;
  if (src.includes("rad-icon")) return false;
  return (
    src.startsWith("data:image/") ||
    src.startsWith("/catalog/photos/") ||
    src.startsWith("/catalog/defaults/") ||
    src.startsWith("/catalog/images/") ||
    src.startsWith("http://") ||
    src.startsWith("https://")
  );
}

export function productPhotoSrc(src?: string) {
  if (!src) return null;
  if (src.startsWith("/catalog/images/")) return `/backend${src}`;
  if (src.startsWith("/catalog/") || src.startsWith("data:") || src.startsWith("http")) {
    return src;
  }
  return null;
}

export function hasRealProductImage(product: Product) {
  return Boolean(product.images?.some((image) => isFileProductImage(image.src)));
}

function availabilityRank(status: ProductStatus) {
  if (status === "sold") return 2;
  if (status === "reserved") return 1;
  return 0;
}

export function overlayLiveProduct(display: Product, live?: Product): Product {
  if (!live) return display;
  return {
    ...display,
    status:
      availabilityRank(display.status) >= availabilityRank(live.status)
        ? display.status
        : live.status,
  };
}

export function overlayLiveCatalog(display: Product[], live: Product[]): Product[] {
  const bySlug = new Map(live.map((product) => [product.slug, product]));
  const seen = new Set<string>();
  const merged = display.map((product) => {
    seen.add(product.slug);
    return overlayLiveProduct(product, bySlug.get(product.slug));
  });
  for (const product of live) {
    if (!seen.has(product.slug) && hasRealProductImage(product)) merged.push(product);
  }
  return merged;
}
