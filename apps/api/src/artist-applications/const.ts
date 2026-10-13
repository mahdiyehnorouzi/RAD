/** Mirrors category/shipping ids used by the storefront collaboration wizard. */
export const ARTWORK_CATEGORIES = [
  "wood",
  "ceramics",
  "metal",
  "textile",
  "paper",
  "glass",
  "stone",
  "other",
] as const;

export const SHIPPING_METHODS = [
  "studio_dropoff",
  "self_ship",
  "either",
] as const;

export const ARTIST_APPLICATION_STATUSES = [
  "submitted",
  "reviewing",
  "approved",
  "declined",
] as const;

export const ARTWORK_IMAGE_MAX = 5;
export const ARTWORK_IMAGE_LIMIT = 2 * 1024 * 1024;
export const ARTWORK_IMAGE_ERROR =
  "فقط تصویر JPEG، PNG یا WebP تا ۲ مگابایت برای هر اثر مجاز است.";
export const ABOUT_MAX = 500;
