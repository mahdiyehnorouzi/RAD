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
