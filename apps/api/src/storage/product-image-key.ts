/**
 * S3 object prefix a new upload's signed params target.
 *
 * Namespaced by the product's immutable `id`, never by `slug` (slug is
 * editable-looking at the DTO layer even though `AdminService.updateProduct`
 * currently rejects any change to it after creation — namespacing by `id`
 * means this still holds even if that restriction is ever relaxed).
 *
 * `productId` is `null` for uploads that happen before a product exists
 * yet (the admin "create" dialog lets an admin attach images before the
 * first save) — those go to the unassociated `rad/pending` folder instead.
 *
 * Pending uploads use a stable prefix until attached to a product.
 */
export function productImageFolder(productId: string | null) {
  return productId ? `rad/products/${productId}` : "rad/pending";
}

/** Matches the object-key namespace for a product upload. */
export function productImageObjectKeyPattern(productId: string) {
  return new RegExp(`^rad/products/${productId}/[A-Za-z0-9_-]+$`);
}

/**
 * Matches a not-yet-associated upload: signed by our own endpoint before
 * the product it belongs to existed, so it carries no id to check against.
 * Accepted at save time for any product — safe because only an
 * authenticated admin with `product.write` can ever request a signature
 * for, or submit, one.
 */
export const PENDING_PRODUCT_IMAGE_OBJECT_KEY_PATTERN =
  /^rad\/pending\/[A-Za-z0-9_-]+$/;

export function isValidProductImageObjectKey(
  productId: string,
  objectKey: string,
) {
  return (
    productImageObjectKeyPattern(productId).test(objectKey) ||
    PENDING_PRODUCT_IMAGE_OBJECT_KEY_PATTERN.test(objectKey)
  );
}
