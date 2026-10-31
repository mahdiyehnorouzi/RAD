import type { ProductStatus } from "@rad/types";
import type { PurchaseButton } from "../purchase-view";

export type PurchaseState = {
  inBag: boolean;
  reserved: boolean;
  /** Another collector's hold, and only after the bag snapshot has loaded. */
  heldByOther: boolean;
  sold: boolean;
  withdrawn: boolean;
  ownOrderId: string | null;
  status?: ProductStatus;
  label: string | null;
  open: boolean;
  button: PurchaseButton;
};
