"use client";
import { useSearchParams } from "next/navigation";
import type { PurchaseState } from "../type";

/**
 * Dev-only visual QA hook: reads `?__devState=available|loading|added|sold|reserved`
 * and returns a partial PurchaseState override for `ProductFloatingBuy`'s
 * presentational render only. Only ever mounted (via
 * `DevPurchaseStateReader`) when `process.env.NODE_ENV !== "production"` —
 * conditionally mounting a child component is fine under rules-of-hooks
 * (unlike conditionally calling a hook inside one component's own render),
 * and keeps `useSearchParams()` out of the production render tree entirely.
 */
export function useDevPurchaseOverride(): Partial<PurchaseState> | null {
  const params = useSearchParams();
  const devState = params.get("__devState");
  switch (devState) {
    case "available":
      return {
        inBag: false,
        reserved: false,
        withdrawn: false,
        sold: false,
        ownOrderId: null,
      };
    case "loading":
      return {
        inBag: false,
        reserved: false,
        withdrawn: false,
        sold: false,
        ownOrderId: null,
      };
    case "added":
      return {
        inBag: true,
        reserved: false,
        withdrawn: false,
        sold: false,
        ownOrderId: null,
      };
    case "sold":
      return {
        inBag: false,
        reserved: false,
        withdrawn: false,
        sold: true,
        ownOrderId: null,
      };
    case "reserved":
      return {
        inBag: false,
        reserved: true,
        withdrawn: false,
        sold: false,
        ownOrderId: null,
      };
    default:
      return null;
  }
}
