import {
  LEGACY_PRODUCT_STATUS,
  PRODUCT_STATUSES,
  PRODUCT_STATUS_TRANSITIONS,
} from "./const/product-status";
import type { ProductStatus } from "./type";

export function isProductStatus(value: string): value is ProductStatus {
  return (PRODUCT_STATUSES as readonly string[]).includes(value);
}

export function normalizeProductStatus(value: string): ProductStatus {
  if (isProductStatus(value)) return value;
  return (
    LEGACY_PRODUCT_STATUS[value as keyof typeof LEGACY_PRODUCT_STATUS] ??
    "draft"
  );
}

export function canTransitionProductStatus(
  from: ProductStatus,
  to: ProductStatus,
) {
  if (from === to) return true;
  return (
    PRODUCT_STATUS_TRANSITIONS[from] as readonly ProductStatus[]
  ).includes(to);
}
