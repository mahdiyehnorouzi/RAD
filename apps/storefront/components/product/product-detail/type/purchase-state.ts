import type { ProductStatus } from "@rad/types";

export type PurchaseState = {
  inBag: boolean;
  reserved: boolean;
  sold: boolean;
  withdrawn: boolean;
  status?: ProductStatus;
  label: string | null;
};
