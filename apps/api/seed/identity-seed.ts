/**
 * Whether a catalog seed row may take a RAD number.
 * Reserved, retired, and numbers already held by another work are left alone.
 */
export function plannedSeedRadNumber(input: {
  recordNumber: number;
  existingProductId: string | null;
  existingProductNumber: number | null;
  holderProductId: string | null;
  identity: { status: string; productId: string | null } | null;
}) {
  if (
    input.existingProductNumber != null &&
    input.existingProductNumber !== input.recordNumber
  ) {
    return input.existingProductNumber;
  }
  const heldByOther = Boolean(
    input.holderProductId && input.holderProductId !== input.existingProductId,
  );
  const identityBlocked = Boolean(
    input.identity &&
    (input.identity.status === "retired" ||
      input.identity.status === "reserved" ||
      (input.identity.productId &&
        input.identity.productId !== input.existingProductId)),
  );
  if (heldByOther || identityBlocked) return input.existingProductNumber;
  return input.recordNumber;
}
