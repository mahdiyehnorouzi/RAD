/**
 * Decision logic for a future orphaned-upload sweep — NOT an executed job.
 *
 * `S3StorageService.verifyMedia` already deletes an object it positively
 * identifies as invalid (wrong signature, oversized, etc). It has no way
 * to delete an object that is perfectly valid but simply never got used:
 * a presigned URL was issued (`rad/pending/...`) and either never
 * uploaded to, or uploaded to but never followed by a `verifyMedia`/save
 * call (the admin closed the dialog, the tab crashed, the request to
 * `/admin/.../media/verify` never arrived). Those objects accumulate in
 * `rad/pending/` indefinitely — the exact same accepted gap
 * `cloudinary-storage.service.ts`'s module comment documents for
 * Cloudinary's `rad/pending/` uploads (`PENDING_UPLOAD_CLEANUP_POLICY`).
 *
 * This module only decides WHICH objects a sweep should consider
 * abandoned, given their key and last-modified time (as `ListObjectsV2`
 * would report). It does not call `ListObjectsV2`/`DeleteObjectCommand`
 * itself, and nothing in this codebase schedules or runs such a sweep —
 * that is deliberately left to a later PR with production access to
 * verify first whether SeaweedFS's S3 gateway supports bucket lifecycle
 * rules (if so, an expiry rule on the `rad/pending/` prefix is simpler
 * and more reliable than an application-level sweep job and should be
 * preferred).
 *
 * Only `rad/pending/` objects are ever "abandoned" by this definition —
 * an object already namespaced under a real `rad/products/<id>/` either
 * belongs to a saved product (keep) or was already deleted by
 * `verifyMedia`'s own rejection-cleanup path; there is no "orphaned but
 * namespaced" state this module needs to reason about.
 */

/** Default age after which an un-claimed `rad/pending/` object is considered abandoned. */
export const DEFAULT_PENDING_UPLOAD_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const PENDING_PREFIX = "rad/pending/";

export function isAbandonedPendingUpload(
  objectKey: string,
  lastModified: Date,
  now: Date = new Date(),
  maxAgeMs: number = DEFAULT_PENDING_UPLOAD_MAX_AGE_MS,
): boolean {
  if (!objectKey.startsWith(PENDING_PREFIX)) return false;
  const ageMs = now.getTime() - lastModified.getTime();
  return ageMs > maxAgeMs;
}
