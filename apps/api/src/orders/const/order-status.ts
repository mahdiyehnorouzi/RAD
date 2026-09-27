/**
 * Mirrors `STORE_ORDER_STATUSES` in `@rad/types` (the API is CommonJS and
 * cannot import that ESM package). Keep both lists identical.
 *
 * pending_payment → pending_verification → confirmed → packing → shipped → delivered
 *
 * `expired` (payment window ran out), `rejected` (RAD refused the receipt),
 * `cancelled` and `returned` are terminal branches that restock the work.
 */
export const STORE_ORDER_STATUSES = [
  "pending_payment",
  "pending_verification",
  "confirmed",
  "packing",
  "shipped",
  "delivered",
  "expired",
  "rejected",
  "cancelled",
  "returned",
] as const;

/** Orders whose works are still reserved for the buyer but not yet paid for. */
export const OPEN_PAYMENT_STATUSES = [
  "pending_payment",
  "pending_verification",
] as const;

/**
 * Status changes staff may make from the generic order editor. Payment
 * outcomes (confirm / reject) go through the payment review endpoints only.
 */
export const MANUAL_ORDER_TRANSITIONS = {
  pending_payment: ["cancelled"],
  pending_verification: ["cancelled"],
  confirmed: ["packing", "shipped", "cancelled"],
  packing: ["confirmed", "shipped", "cancelled"],
  shipped: ["packing", "delivered", "returned"],
  delivered: ["shipped", "returned"],
  expired: [],
  rejected: [],
  cancelled: [],
  returned: [],
} as const;

/** Statuses written before payment verification became its own step. */
export const LEGACY_ORDER_STATUS = {
  payment_pending: "pending_payment",
  received: "pending_payment",
  approved: "confirmed",
  forming: "packing",
  drying: "packing",
  firing: "packing",
  glazing: "packing",
  quality: "packing",
} as const;

/** A valid order reserves its works for this long while the buyer transfers. */
export const ORDER_PAYMENT_WINDOW_MS = 30 * 60 * 1000;

export const PAYMENT_REJECTION_REASON_MAX = 500;
