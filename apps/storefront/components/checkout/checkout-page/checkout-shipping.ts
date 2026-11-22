import { EXPRESS_POST_FEE_TOMAN } from "@rad/types";
import { locationSelection } from "@/lib/geo/iran-locations";

/**
 * Courier is the Tehran city method. Other cities in Tehran province,
 * and every other province, stay on post.
 */
export const TEHRAN_CITY_LABEL = "تهران";

export type CheckoutShippingMethod = "express" | "courier";

export function expressPostFeeToman() {
  return EXPRESS_POST_FEE_TOMAN;
}

export function isTehranCity(provinceId: string, cityId: string) {
  const place = locationSelection(provinceId, cityId);
  return place.ok && place.cityLabel === TEHRAN_CITY_LABEL;
}

/** Drops courier when the address is no longer Tehran. Express stays. */
export function normalizeShippingMethod(
  provinceId: string,
  cityId: string,
  method: string | undefined,
): CheckoutShippingMethod | "" {
  if (method === "express") return "express";
  if (method === "courier" && isTehranCity(provinceId, cityId))
    return "courier";
  return "";
}
