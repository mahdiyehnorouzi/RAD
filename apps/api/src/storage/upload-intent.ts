/**
 * Audit finding (SeaweedFS integration finish-up): `AdminService`'s
 * ownership check for a remote-media `objectKey` was namespace-shape
 * only (`isValidProductImagePublicId`) — does this key's shape match
 * `rad/products/<id>/...`? That is NOT proof the current request is the
 * authorized upload flow that actually minted the key, only that the
 * key's shape is plausible. For Cloudinary this was historically an
 * accepted risk because Cloudinary's own account-level existence check
 * backs it up; for SeaweedFS there is no equivalent backstop — a
 * correctly-shaped, still-existing key (seen in another admin's
 * in-progress upload, a log line, browser history) could otherwise be
 * attached to a different product than it was actually signed for, or
 * re-claimed by a second product after already being attached to a
 * first one.
 *
 * `AdminService#authorizeRemoteObjectKey` uses this module FAIL-CLOSED:
 * for a genuinely NEW object (no existing `ProductImage` row anywhere
 * yet), a missing or mismatched record is ALWAYS rejected — there is no
 * fallback to namespace shape alone. Restarts, a second process
 * instance, or TTL expiry can only ever produce a loud, safe rejection
 * (the admin re-uploads), never a silent accept.
 *
 * This does not need to be a durable (database) record, because it is
 * not the ONLY proof available: `authorizeRemoteObjectKey` first checks
 * whether the object is ALREADY a persisted `ProductImage` row for the
 * product being saved — a real Postgres row, durable, shared across
 * every process, immune to restarts — and only consults this in-memory
 * record for the narrow window between "an admin just requested a
 * signed upload" and "that upload was attached to a product for the
 * first time" (a window with no corresponding DB row yet to check). A
 * database-backed "PendingUpload" table would close even that narrow
 * window; not introduced here — that's a schema change requiring
 * separate approval. The residual risk accepted instead: a legitimate,
 * not-yet-saved upload that straddles a restart/instance-change must be
 * redone — an availability cost, never a security hole, since the
 * failure mode is always rejection, never wrongful acceptance.
 *
 * Applied uniformly to both providers (not SeaweedFS-only) so there is
 * one ownership code path, not two — this changes nothing for
 * Cloudinary in practice (every real Cloudinary sign→verify round trip
 * already matches), it just also closes the same narrow gap there.
 *
 * Bounded in size (`sweepExpired` runs on every write) so sustained
 * traffic can't grow this unboundedly — RAD's documented admin-only,
 * low-volume usage means this is belt-and-braces, not a load concern.
 */

interface IssuedUpload {
  productId: string | null;
  kind: "image" | "video";
  issuedAt: number;
}

/** How long a minted-but-unused key is remembered before being treated as unknown. Not a security boundary itself (the namespace + durable-row checks are) — just bounds the window a legitimate not-yet-saved upload can straddle. */
export const UPLOAD_INTENT_MAX_AGE_MS = 2 * 60 * 60 * 1000;

/** Hard cap so a sustained burst can't grow this unboundedly between sweeps. */
const MAX_TRACKED_INTENTS = 5_000;

const issuedUploads = new Map<string, IssuedUpload>();

function sweepExpired(now: number) {
  for (const [key, intent] of issuedUploads) {
    if (now - intent.issuedAt > UPLOAD_INTENT_MAX_AGE_MS)
      issuedUploads.delete(key);
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
 * `issuedAt` defaults to `Date.now()`; real callers never pass it — it
 * exists so tests can simulate an already-expired intent directly
 * (backdating it) rather than needing a fake clock or a real wait.
 */
export function recordIssuedUpload(
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
 * than once for the same upload) whether this process itself issued
 * `objectKey`, and if so whether it matches the `productId`/`kind`
 * being claimed now.
 *
 * `"unknown"` (no record at all) and `"mismatch"` (recorded, but for a
 * different product/kind) are distinguished only for logging —
 * `AdminService#authorizeRemoteObjectKey` (the only caller) treats both
 * as a hard rejection. Neither is ever soft.
 *
 * A key signed while PENDING (`intent.productId === null` — no product
 * existed yet) matches any `productId` claimed now: that is exactly the
 * pre-creation-upload lifecycle the shared `rad/pending/` namespace
 * exists for. Only a key signed for an ALREADY-real product is held to
 * that exact product from then on; a `kind` mismatch (image vs video)
 * is always a hard mismatch regardless of namespace.
 *
 * Checks the record's age on every call, not only when some unrelated
 * write happens to trigger a sweep — an intent older than
 * `UPLOAD_INTENT_MAX_AGE_MS` reads as `"unknown"` even before it's been
 * physically evicted.
 */
export function checkIssuedUpload(
  objectKey: string,
  productId: string | null,
  kind: "image" | "video",
): "match" | "mismatch" | "unknown" {
  const intent = issuedUploads.get(objectKey);
  if (!intent) return "unknown";
  if (Date.now() - intent.issuedAt > UPLOAD_INTENT_MAX_AGE_MS) return "unknown";
  if (intent.kind !== kind) return "mismatch";
  if (intent.productId !== null && intent.productId !== productId)
    return "mismatch";
  return "match";
}

/** Test-only: resets module state between specs. */
export function __resetIssuedUploadsForTests() {
  issuedUploads.clear();
}
