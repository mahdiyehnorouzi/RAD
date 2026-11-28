import type { Order, PaymentStatus, StoreOrderStatus } from "@rad/types";

const POLICY_ORDER_STATUSES: readonly StoreOrderStatus[] = [
  "pending_payment",
  "pending_verification",
  "confirmed",
  "packing",
  "shipped",
  "delivered",
];

const FAILED_PAYMENT: readonly PaymentStatus[] = [
  "failed",
  "rejected",
  "verify_error",
  "verify_conflict",
];

/** Policies stay with a live or completed purchase, never with a failed or closed one. */
export function showOrderPolicies(
  order: Pick<Order, "status" | "payment" | "policyAcceptance">,
) {
  if (!POLICY_ORDER_STATUSES.includes(order.status)) return false;
  if (order.payment && FAILED_PAYMENT.includes(order.payment.status)) {
    return false;
  }
  const versions = order.policyAcceptance?.versions;
  return Boolean(versions && Object.keys(versions).length > 0);
}
