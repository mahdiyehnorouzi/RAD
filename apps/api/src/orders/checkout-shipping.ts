import { EXPRESS_POST_FEE_TOMAN } from "@rad/types";

const TEHRAN_CITY = "تهران";

/**
 * The checkout city snapshot is `province، city` (see the storefront).
 * A bare `تهران` is the older single-field value and still means Tehran.
 */
export function isTehranDeliveryCity(city: string) {
  const parts = city
    .split(/[،,]/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return false;
  return parts[parts.length - 1] === TEHRAN_CITY;
}

export type QuotedShipping =
  | { ok: true; method: "express" | "courier" | null; feeToman: number }
  | { ok: false; code: "courier_tehran_only" | "shipping_method_invalid" };

/**
 * The fee is computed here. A client-sent amount is never an input.
 * Express Post is a flat per-order charge. Courier is not charged yet.
 */
export function quoteCheckoutShipping(
  method: string | undefined,
  city: string,
): QuotedShipping {
  if (!method) return { ok: true, method: null, feeToman: 0 };
  if (method === "express") {
    return { ok: true, method: "express", feeToman: EXPRESS_POST_FEE_TOMAN };
  }
  if (method === "courier") {
    if (!isTehranDeliveryCity(city)) {
      return { ok: false, code: "courier_tehran_only" };
    }
    return { ok: true, method: "courier", feeToman: 0 };
  }
  return { ok: false, code: "shipping_method_invalid" };
}
