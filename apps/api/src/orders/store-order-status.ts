export const STORE_ORDER_STATUSES = [
  "payment_pending",
  "confirmed",
  "packing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
] as const;

export type StoreOrderStatus = (typeof STORE_ORDER_STATUSES)[number];

const legacy: Record<string, StoreOrderStatus> = {
  received: "payment_pending",
  approved: "confirmed",
  forming: "packing",
  drying: "packing",
  firing: "packing",
  glazing: "packing",
  quality: "packing",
};

export function normalizeStoreOrderStatus(status: string): StoreOrderStatus {
  if ((STORE_ORDER_STATUSES as readonly string[]).includes(status)) {
    return status as StoreOrderStatus;
  }
  return legacy[status] ?? "confirmed";
}

export function isStoreOrderStatus(value: string): value is StoreOrderStatus {
  return (STORE_ORDER_STATUSES as readonly string[]).includes(value);
}
