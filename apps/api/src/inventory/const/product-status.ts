/**
 * Mirrors `PRODUCT_STATUSES` in `@rad/types` (the API is CommonJS and cannot
 * import that ESM package). Keep both lists identical.
 */
export const PRODUCT_STATUSES = [
  "draft",
  "in_workshop",
  "ready",
  "available",
  "sold",
  "archived",
] as const;

export const HIDDEN_PRODUCT_STATUSES = ["draft"] as const;

export const PRODUCT_STATUS_TRANSITIONS = {
  draft: ["in_workshop", "ready", "available", "archived"],
  in_workshop: ["draft", "ready", "archived"],
  ready: ["in_workshop", "available", "archived"],
  available: ["ready", "sold", "archived"],
  sold: ["available", "archived"],
  archived: ["available", "sold"],
} as const;

/** Statuses written before the state machine existed. */
export const LEGACY_PRODUCT_STATUS = {
  reserved: "sold",
  review: "draft",
} as const;

export const CART_HOLD_MS = 15 * 60 * 1000;

export const HOLD_SWEEP_INTERVAL_MS = 30 * 1000;

/** Orders that still own their products; cart mutations must not release them. */
export const INVENTORY_OWNING_ORDER_STATUSES = [
  "pending_payment",
  "pending_verification",
  "confirmed",
  "packing",
  "shipped",
  "delivered",
] as const;

/** A timeout cannot establish that these payment attempts are unpaid. */
export const UNRESOLVED_PAYMENT_STATUSES = [
  "redirected",
  "submitted",
  "verified",
  "verify_error",
  "verify_conflict",
] as const;
