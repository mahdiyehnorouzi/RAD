import type { StoreOrderStatus } from "@rad/types";

/** Order help leads with payment while money or a receipt is still unresolved. */
export const PAYMENT_HELP_STATUSES: readonly StoreOrderStatus[] = [
  "pending_payment",
  "pending_verification",
  "rejected",
  "expired",
];
