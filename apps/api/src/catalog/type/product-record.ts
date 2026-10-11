import type { Product, ProductImage, Vendor } from "../../database/entities";

export type ProductImageMeta = Pick<
  ProductImage,
  | "id"
  | "alt"
  | "enAlt"
  | "color"
  | "accent"
  | "shape"
  | "sortOrder"
  | "storage"
  | "objectKey"
> & { src?: string | null };

export type EnCopy = {
  name: string;
  subtitle: string;
  story: string;
  details: string[];
};

/** A `Product` row with image metadata only (no base64 `src` unless embedded). */
export type ProductRecord = Omit<
  Product,
  | "images"
  | "vendor"
  | "cartItems"
  | "favorites"
  | "reviews"
  | "orderItems"
  | "assignId"
> & {
  images: ProductImageMeta[];
  vendor: Vendor | null;
};
