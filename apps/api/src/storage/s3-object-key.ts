import { randomBytes } from "node:crypto";
import { productImageFolder } from "./cloudinary-storage.service";

/**
 * Length of the random token minted per object (before base64url
 * encoding). 24 raw bytes -> 32 base64url characters: enough entropy
 * (192 bits) that an object key cannot be guessed or enumerated, unlike
 * Cloudinary's design where the browser-side SDK was free to pick its own
 * `public_id` within the signed folder. Unlike Cloudinary, the full S3 key
 * (folder + token) is minted server-side in `createSignedUpload`, so this
 * is the only source of the key — the client never gets to choose it.
 */
const TOKEN_BYTES = 24;

export function mintS3ObjectToken() {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

/** Matches exactly what `mintS3ObjectKey` can produce for `productId`. */
export function s3ObjectKeyPattern(productId: string) {
  return new RegExp(
    `^${escapeRegExp(productImageFolder(productId))}/[A-Za-z0-9_-]{32}$`,
  );
}

/** Matches a not-yet-associated upload, same `rad/pending/` convention Cloudinary uses. */
export const PENDING_S3_OBJECT_KEY_PATTERN = /^rad\/pending\/[A-Za-z0-9_-]{32}$/;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function mintS3ObjectKey(folder: string) {
  return `${folder}/${mintS3ObjectToken()}`;
}

/**
 * Ownership/traversal check for an S3 object key, mirroring
 * `isValidProductImagePublicId` (`cloudinary-storage.service.ts`) exactly:
 * a key must be namespaced under the caller's own `productId` (or the
 * unassociated `rad/pending/` namespace for pre-save uploads) and must be
 * one of our own minted tokens — never an arbitrary client-supplied
 * string, which rules out path traversal and claiming another product's
 * uploaded object.
 *
 * Not yet called anywhere (`AdminService` isn't changed by this PR) — this
 * is the validation `AdminService.verifyProductMedia`/`saveProduct` will
 * need to call once an S3-backed provider is actually wired in, exactly
 * where it already calls `isValidProductImagePublicId` for Cloudinary.
 */
export function isValidS3ObjectKey(productId: string, objectKey: string) {
  return (
    s3ObjectKeyPattern(productId).test(objectKey) ||
    PENDING_S3_OBJECT_KEY_PATTERN.test(objectKey)
  );
}

/**
 * Shape-only check: is this *syntactically* one of our own minted keys
 * (`rad/products/<any-id>/<32-char-token>` or `rad/pending/<token>`),
 * with no traversal sequences and no characters outside the token
 * alphabet — WITHOUT checking which product it belongs to.
 *
 * This is NOT an ownership/authorization check (use `isValidS3ObjectKey`
 * with the resolved `productId` for that). It exists only for contexts
 * that have an `objectKey` but no `productId` to check it against — e.g.
 * `product.mapper.ts#s3DeliveryUrl`, which must refuse to build a URL
 * from a key that isn't well-formed (defense in depth: a key already
 * read back out of our own DB should always be well-formed, since
 * nothing writes one that isn't yet, but a URL builder should never
 * assume that rather than checking) without needing to thread a
 * productId through read-path code that doesn't otherwise have one.
 */
export function isWellFormedS3ObjectKey(objectKey: string) {
  return (
    /^rad\/products\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]{32}$/.test(objectKey) ||
    PENDING_S3_OBJECT_KEY_PATTERN.test(objectKey)
  );
}
