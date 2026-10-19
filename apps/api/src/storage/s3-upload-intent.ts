/**
 * Review (PR 4, Task 3): can the architecture prove that a previously
 * signed S3 object actually belongs to the SPECIFIC upload flow that
 * requested it, rather than just that its key happens to be
 * well-formed and correctly namespaced?
 *
 * Today's answer, for BOTH providers, is: no — not at that granularity.
 * The existing (already-shipped, already-accepted) model is:
 * "any authenticated admin with `product.write` can claim any key that
 * matches the expected namespace for the target product (or the shared
 * `rad/pending/` namespace)". `cloudinary-storage.service.ts`'s own doc
 * comments say this plainly for Cloudinary ("safe because only an
 * authenticated admin with `product.write` can ever request a signature
 * for, or submit, one") — namespace + authentication + permission is the
 * accepted trust boundary, not per-request binding. That model doesn't
 * change here.
 *
 * What's missing, and what IS worth closing for S3 specifically: S3's
 * object key is our ONLY unpredictability guarantee (unlike Cloudinary,
 * which also has its own account-level existence check backing it up —
 * see `ownership-parity.spec.ts`'s "divergence, by design" test). A
 * namespace-only check means any admin who ever saw ANY correctly-shaped,
 * still-existing S3 key (e.g. from another admin's in-progress upload,
 * a log line, a browser history entry) could attach it to a DIFFERENT
 * product than the one it was actually signed for — the one exception
 * namespace-matching alone doesn't catch: "did WE ever issue this
 * specific key for a sign request, at all".
 *
 * A database-backed "PendingUpload" table would be the durable way to
 * record and check this, but Task 3 explicitly rules out a schema change
 * without approval. The smallest safe solution consistent with that
 * constraint: a process-local, in-memory record of every key this
 * process's own `createSignedUpload` actually minted for S3, consulted
 * (not required — see below) when verifying. This is deliberately NOT a
 * persistence layer:
 * - Lost on restart — acceptable because RAD runs a single PM2 process on
 *   one VPS (not a cluster), and because this check is additive, not the
 *   only gate: `isValidS3ObjectKey`'s namespace check still applies
 *   regardless, so losing this record on restart only widens the window
 *   back to today's already-accepted model, never below it.
 * - Bounded in size (`sweepExpired` runs on every write) so it can't grow
 *   unbounded under sustained traffic — though RAD's own documented
 *   admin-only, low-volume usage pattern means this is a belt-and-braces
 *   measure, not a load concern in practice.
 * - A SOFT signal in `AdminService`, not hard-mandatory: if the record is
 *   missing (restart, TTL expiry, or a deploy between sign and verify),
 *   verification falls back to the existing namespace-only check rather
 *   than rejecting a legitimate upload outright. This means an attacker
 *   who can force or wait out a restart still only has the EXISTING
 *   accepted model's guarantees to beat — never a NEW, weaker one — while
 *   a same-process sign→verify round-trip (the overwhelming majority of
 *   real admin usage) gets the stronger, intent-bound guarantee.
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

/** Records that THIS process's `createSignedUpload` minted `objectKey` for `productId` (or `null` for the shared pending namespace). */
export function recordIssuedS3Upload(
  objectKey: string,
  productId: string | null,
  kind: "image" | "video",
) {
  const now = Date.now();
  sweepExpired(now);
  issuedUploads.set(objectKey, { productId, kind, issuedAt: now });
}

/**
 * Looks up (without removing — verification may legitimately run more
 * than once for the same upload, e.g. the existing verify-then-save
 * double-check pattern `AdminService` already has for Cloudinary)
 * whether this process itself issued `objectKey`, and if so whether it
 * matches the `productId`/`kind` being claimed now.
 *
 * Returns `"unknown"` (not `false`) when there is no record at all,
 * distinguishing "we have no record" (soft — caller may fall back to the
 * namespace-only check) from `"mismatch"` (hard — this key WAS minted by
 * us, but for a different product or kind than now claimed, which is
 * never legitimate and must always be rejected regardless of namespace
 * shape).
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
 */
export function checkIssuedS3Upload(
  objectKey: string,
  productId: string | null,
  kind: "image" | "video",
): "match" | "mismatch" | "unknown" {
  const intent = issuedUploads.get(objectKey);
  if (!intent) return "unknown";
  if (intent.kind !== kind) return "mismatch";
  if (intent.productId !== null && intent.productId !== productId) return "mismatch";
  return "match";
}

/** Test-only: resets module state between specs. */
export function __resetIssuedS3UploadsForTests() {
  issuedUploads.clear();
}
