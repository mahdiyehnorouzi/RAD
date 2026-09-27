import type { PRODUCT_STATUSES } from "../const/product-status";

export type ProductStatus = (typeof PRODUCT_STATUSES)[number];
