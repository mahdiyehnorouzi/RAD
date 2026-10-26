import assert from "node:assert/strict";
import { test } from "node:test";
import { productStatusLabel, type AdminProduct } from "./admin-data";

const now = Date.now();

function product(overrides: Partial<AdminProduct>): AdminProduct {
  return {
    id: "p1",
    slug: "p1",
    name: "Work",
    description: "",
    category: "ceramics",
    price: 100,
    status: "sold",
    artist: "RAD",
    images: [],
    updatedAt: now,
    ...overrides,
  };
}

test("a cart/order hold (reservedUntil in the future) labels as held, not finally sold", () => {
  const held = product({
    reservedUntil: now + 60_000,
    holdExpiresAt: now + 60_000,
    held: true,
  });
  assert.match(productStatusLabel(held), /در سبد مشتری تا/);
});

test("a permanent sale (no reservedUntil) never shows the cart-hold label", () => {
  const sold = product({ held: false });
  assert.equal(productStatusLabel(sold), "فروخته شده");
});

test("sold and still held with no reservedUntil (receipt submitted) shows awaiting-verification", () => {
  const awaitingVerification = product({ held: true });
  assert.equal(
    productStatusLabel(awaitingVerification),
    "فروخته شده · در انتظار تأیید پرداخت",
  );
});

test("a stale, already-expired reservedUntil no longer reads as held (fixes the old truthy-only check)", () => {
  const expired = product({
    reservedUntil: now - 1,
    holdExpiresAt: now - 1,
    held: true,
  });
  assert.equal(
    productStatusLabel(expired),
    "فروخته شده · در انتظار تأیید پرداخت",
  );
});

test("non-sold statuses fall back to their plain label", () => {
  assert.equal(
    productStatusLabel(product({ status: "available", held: false })),
    "موجود",
  );
});
