/**
 * Security review follow-up (post-PR 4): the original version of this
 * module treated a missing in-memory record (`"unknown"`) as a SOFT
 * signal — callers fell back to namespace-only validation. That is
 * exactly the design this review rejected: namespace validation alone
 * (does this key's shape match `rad/products/<id>/...`?) is NOT proof
 * that the current request is the authorized upload flow that actually
 * minted the key — it only proves the key's shape is plausible. An
 * in-memory record that silently stops mattering the moment it's
 * missing (API restart, a second process instance, TTL expiry) is not a
 * real ownership check, it's a check that only sometimes runs.
 *
 * This module is now used FAIL-CLOSED by its only caller
 * (`AdminService#authorizeS3ObjectKey`): for a genuinely NEW S3 object
 * (one with no existing `ProductImage` row anywhere yet — see that
 * method), a missing or mismatched record is ALWAYS rejected. There is
 * no soft fallback left. Restarts, multiple instances, and TTL expiry
 * cannot silently downgrade this to a weaker check — they can only ever
 * produce a loud, safe rejection (the admin re-uploads), never a silent
 * accept.
 *
 * This still does not need to be a durable (database) record, because
 * it is no longer the ONLY proof available for S3 ownership —
 * `AdminService#authorizeS3ObjectKey` first checks whether the object is
 * ALREADY a persisted `ProductImage` row for the product being saved: if
 * so, that row — in Postgres, durable, shared across every process,
 * immune to restarts — IS the ownership proof, and this in-memory record
 * is never even consulted. This module's record is consulted ONLY for
 * the narrow window between "an admin just requested a signed upload"
 * and "that upload was successfully attached to a product for the first
 * time" — a window that, by construction, has no corresponding DB row
 * yet (there's nothing durable to check). A database-backed
 * "PendingUpload" table would close even that narrow window (surviving a
 * restart mid-upload), but introducing it is a schema change requiring
 * separate approval — see the PR 4 security-review report for the exact
 * proposed schema, migration, and the trade-off of adopting it now vs.
 * accepting the documented residual risk (a legitimate, not-yet-saved
 * upload that straddles a restart/instance-change must be redone — an
 * availability cost, never a security hole, since it can only ever
 * produce a rejection, not a wrongful acceptance).
 *
 * Still bounded in size (`sweepExpired` runs on every write) so sustained
 * traffic can't grow this unboundedly — RAD's documented admin-only,
 * low-volume usage means this is belt-and-braces, not a load concern.
 */

interface IssuedS3Upload {
  productId: string | null;
  kind: "image" | "video";
  issuedAt: number;
}

/** How long a minted-but-unused key is remembered before being swept. Generous relative to realistic upload+save time, not a security boundary itself (`isValidS3ObjectKey` is). */
export const UPLOAD_INTENT_MAX_AGE_MS = 2 * 60 * 60 * 1000;

/** Hard cap so a sustained burst can't grow this unboundedly between sweeps. */
const MAX_TRACKED_INTENTS = 5_000;

const issuedUploads = new Map<string, IssuedS3Upload>();

function sweepExpired(now: number) {
  for (const [key, intent] of issuedUploads) {
    if (now - intent.issuedAt > UPLOAD_INTENT_MAX_AGE_MS) issuedUploads.delete(key);
  }
  if (issuedUploads.size > MAX_TRACKED_INTENTS) {
    const overflow = issuedUploads.size - MAX_TRACKED_INTENTS;
    let i = 0;
    for (const key of issuedUploads.keys()) {
      if (i++ >= overflow) break;
      issuedUploads.delete(key);
    }
  }
}

/**
 * Records that THIS process's `createSignedUpload` minted `objectKey`
 * for `productId` (or `null` for the shared pending namespace).
 *
 * `issuedAt` defaults to `Date.now()`; real callers never pass it —
 * it exists so tests can simulate an already-expired intent directly
 * (backdating it) rather than needing a fake clock or a real 2-hour
 * wait, exercising the same expiry check `checkIssuedS3Upload` applies
 * on every read (see below), not just `sweepExpired`'s write-time pass.
 */
export function recordIssuedS3Upload(
  objectKey: string,
  productId: string | null,
  kind: "image" | "video",
  issuedAt: number = Date.now(),
) {
  const now = Date.now();
  sweepExpired(now);
  issuedUploads.set(objectKey, { productId, kind, issuedAt });
}

/**
 * Looks up (without removing — verification may legitimately run more
 * than once for the same upload, e.g. the existing verify-then-save
 * double-check pattern `AdminService` already has for Cloudinary)
 * whether this process itself issued `objectKey`, and if so whether it
 * matches the `productId`/`kind` being claimed now.
 *
 * Returns `"unknown"` (not `false`) when there is no record at all,
 * distinguishing "we have no record" from `"mismatch"` (this key WAS
 * minted by us, but for a different product or kind than now claimed)
 * only for logging/diagnostic purposes — `AdminService
 * #authorizeS3ObjectKey` (the only caller) treats both as a hard
 * rejection. Neither is ever soft.
 *
 * A key signed while PENDING (`intent.productId === null` — no product
 * existed yet) matches any `productId` claimed now, including a real one:
 * that is exactly the pre-creation-upload lifecycle `cloudinary-storage
 * .service.ts`'s `rad/pending/` namespace exists for — the key is signed
 * before the product is created, then legitimately attached to it on the
 * first save. Only a key signed for an ALREADY-real product (a specific,
 * known `productId` at sign time) is held to that exact product from
 * then on; mismatching `kind` (image vs video) is always a hard mismatch
 * regardless of which namespace was used.
 *
 * Checks the record's age on EVERY call, not only when a sweep happens
 * to run on some unrelated write — an intent older than
 * `UPLOAD_INTENT_MAX_AGE_MS` is treated exactly as `"unknown"` (as if it
 * were never recorded) even if `sweepExpired` hasn't physically evicted
 * it yet (sweeps only run opportunistically, on `recordIssuedS3Upload`,
 * so without this check a stale entry could otherwise still read as a
 * match indefinitely until some other, unrelated upload happened to
 * trigger a sweep).
 */
export function checkIssuedS3Upload(
  objectKey: string,
  productId: string | null,
  kind: "image" | "video",
): "match" | "mismatch" | "unknown" {
  const intent = issuedUploads.get(objectKey);
  if (!intent) return "unknown";
  if (Date.now() - intent.issuedAt > UPLOAD_INTENT_MAX_AGE_MS) return "unknown";
  if (intent.kind !== kind) return "mismatch";
  if (intent.productId !== null && intent.productId !== productId) return "mismatch";
  return "match";
}

/** Test-only: resets module state between specs. */
export function __resetIssuedS3UploadsForTests() {
  issuedUploads.clear();
}
