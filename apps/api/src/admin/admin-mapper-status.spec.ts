import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdminProduct } from "./admin.mapper";
import type { Product, ProductImage, Vendor } from "../database/entities";

/**
 * `reservedUntil` must agree with the public mapper's derivation (see
 * `product.mapper.ts`) so Admin and Storefront resolve the same
 * hold-vs-sale distinction through `effectiveProductStatus` (@rad/types).
 */
function product(
  overrides: Partial<Product>,
): Product & { images: ProductImage[]; vendor: Vendor | null } {
  return {
    id: "prod_1",
    slug: "moon-vase",
    name: "کوزه ماه",
    story: "داستان",
    category: "گلدان",
    tomanPrice: 1_000_000,
    status: "sold",
    holdExpiresAt: null,
    heldBy: null,
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    images: [],
    vendor: null,
    ...overrides,
  } as unknown as Product & { images: ProductImage[]; vendor: Vendor | null };
}

test("a cart/order hold exposes reservedUntil", () => {
  const holdExpiresAt = new Date(Date.now() + 60_000);
  const result = toAdminProduct(
    product({ status: "sold", holdExpiresAt, heldBy: "guest:1" }),
  );
  assert.equal(result.reservedUntil, holdExpiresAt.getTime());
});

test("a permanent sale (no holdExpiresAt) never exposes reservedUntil", () => {
  const result = toAdminProduct(
    product({ status: "sold", holdExpiresAt: null, heldBy: null }),
  );
  assert.equal(result.reservedUntil, undefined);
});

test("an available product never exposes reservedUntil, even with a stale holdExpiresAt", () => {
  const result = toAdminProduct(
    product({
      status: "available",
      holdExpiresAt: new Date(Date.now() + 60_000),
      heldBy: null,
    }),
  );
  assert.equal(result.reservedUntil, undefined);
});
