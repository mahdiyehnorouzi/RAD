import {
  LEGACY_ORDER_STATUS,
  MANUAL_ORDER_TRANSITIONS,
  STORE_ORDER_STATUSES,
} from "./const";
import type { StoreOrderStatus } from "./type";

export function isStoreOrderStatus(value: string): value is StoreOrderStatus {
  return (STORE_ORDER_STATUSES as readonly string[]).includes(value);
}

export function normalizeStoreOrderStatus(status: string): StoreOrderStatus {
  if (isStoreOrderStatus(status)) return status;
  return (
    LEGACY_ORDER_STATUS[status as keyof typeof LEGACY_ORDER_STATUS] ??
    "confirmed"
  );
}

export function canManuallyTransitionOrder(
  from: StoreOrderStatus,
  to: StoreOrderStatus,
) {
  if (from === to) return true;
  return (MANUAL_ORDER_TRANSITIONS[from] as readonly StoreOrderStatus[]).includes(
    to,
  );
}
