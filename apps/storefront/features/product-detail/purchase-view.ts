import type { ProductStatus } from "@rad/types";
import { isGoneStatus } from "@/lib/catalog/product-status";

export type PurchaseButton =
  | "add"
  | "in-bag"
  | "resume"
  | "reserved"
  | "sold"
  | "withdrawn"
  | "unavailable";

/**
 * One decision for the availability dot and the purchase button.
 * A refused add must not paint the button "sold" while the dot stays green:
 * `open` is the green state, and it is never combined with `sold`.
 */
export function purchaseView(input: {
  status?: ProductStatus;
  inBag: boolean;
  reserved: boolean;
  sold: boolean;
  withdrawn: boolean;
  ownOrderId?: string | null;
}): { open: boolean; button: PurchaseButton } {
  if (input.withdrawn) return { open: false, button: "withdrawn" };
  if (input.ownOrderId) return { open: false, button: "resume" };
  if (input.inBag) return { open: false, button: "in-bag" };
  if (input.reserved) return { open: false, button: "reserved" };
  if (input.sold || isGoneStatus(input.status)) {
    return { open: false, button: "sold" };
  }
  if (input.status === "available") return { open: true, button: "add" };
  return { open: false, button: "unavailable" };
}
