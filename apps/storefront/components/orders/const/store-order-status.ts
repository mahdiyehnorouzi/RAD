import type { MessageKey } from "@/i18n/fa";
import type { Order, Product, StoreOrderStatus } from "@rad/types";
import {
  STORE_ORDER_PROGRESS,
  isTerminalStoreOrderStatus,
  storeOrderStatusLabels,
} from "@rad/types";

export { STORE_ORDER_PROGRESS, storeOrderStatusLabels };

export const STORE_ORDER_STATUS_KEY: Record<StoreOrderStatus, MessageKey> = {
  pending_payment: "shopStagePaymentPending",
  pending_verification: "shopStagePaymentReview",
  confirmed: "shopStageConfirmed",
  packing: "shopStagePacking",
  shipped: "shopStageShipped",
  delivered: "shopStageDelivered",
  expired: "shopStageExpired",
  rejected: "shopStageRejected",
  cancelled: "shopStageCancelled",
  returned: "shopStageReturned",
};

export function shopStageIndex(status: StoreOrderStatus) {
  const index = STORE_ORDER_PROGRESS.indexOf(status);
  return index < 0 ? 0 : index;
}

export function isTerminalStoreStatus(status: StoreOrderStatus) {
  return isTerminalStoreOrderStatus(status);
}

export function radArtworkNumber(slug: string, products: Product[]) {
  const product = products.find((item) => item.slug === slug);
  if (product?.artworkNumber) return product.artworkNumber;
  const index = products.findIndex((item) => item.slug === slug);
  return `RAD-${String(27 + Math.max(0, index)).padStart(3, "0")}`;
}

export function formatShippingAddress(delivery: Order["delivery"]) {
  return [delivery.address, delivery.city, delivery.name]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join("، ");
}
