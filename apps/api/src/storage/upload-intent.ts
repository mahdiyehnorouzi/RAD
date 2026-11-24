/**
 * Tracks upload keys issued by this API. A new remote object can only be
 * attached to the product and media kind for which the API signed it.
 * Persisted rows provide durable ownership proof; this bounded in-memory
 * record protects the interval before the first save.
 */

interface IssuedUpload {
  productId: string | null;
  kind: "image" | "video";
  issuedAt: number;
}

/** How long a newly issued but unattached upload remains eligible for save. */
export const UPLOAD_INTENT_MAX_AGE_MS = 2 * 60 * 60 * 1000;

/** Hard cap so a sustained burst cannot grow this map without bound. */
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

export function recordIssuedUpload(
  objectKey: string,
  productId: string | null,
  kind: "image" | "video",
  issuedAt: number = Date.now(),
) {
  sweepExpired(Date.now());
  issuedUploads.set(objectKey, { productId, kind, issuedAt });
}

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

/** Test-only reset; production code never clears issued intents manually. */
export function __resetIssuedUploadsForTests() {
  issuedUploads.clear();
}
