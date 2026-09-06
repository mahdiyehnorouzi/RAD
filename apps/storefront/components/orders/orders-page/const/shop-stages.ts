import type { MessageKey } from "@/i18n/fa";
import type { OrderStatus } from "@rad/types";

export const SHOP_STAGES: OrderStatus[] = [
  "received",
  "approved",
  "forming",
  "drying",
  "firing",
  "glazing",
  "quality",
  "shipped",
  "delivered",
];

export const SHOP_STAGE_KEY: Record<OrderStatus, MessageKey> = {
  received: "shopStageReceived",
  approved: "shopStageApproved",
  forming: "shopStageForming",
  drying: "shopStageDrying",
  firing: "shopStageFiring",
  glazing: "shopStageGlazing",
  quality: "shopStageQuality",
  shipped: "shopStageShipped",
  delivered: "shopStageDelivered",
};

export function shopStageIndex(status: OrderStatus) {
  const index = SHOP_STAGES.indexOf(status);
  return index < 0 ? 0 : index;
}
