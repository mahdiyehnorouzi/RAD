import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import {
  startPurchaseHarness,
  type PurchaseHarness,
} from "./testing/purchase-harness";

let rad: PurchaseHarness;
before(async () => {
  rad = await startPurchaseHarness();
});
after(async () => {
  await rad?.stop();
});

/** Carries an order from checkout to `pending_verification`. */
async function submitReceipt(
  rad: PurchaseHarness,
  buyer: ReturnType<PurchaseHarness["buyer"]>,
  slug: string,
) {
  const order = await rad.placeOrder(buyer, slug);
  await rad.orders.confirmPayment(buyer, order.id, {
    receiptImage: rad.receipt(),
    trackingNumber: rad.trackingNumber(),
  });
  return order;
}

test("rejecting a submitted payment restocks the work, flips the order, and notifies the storefront", async () => {
  const buyer = rad.buyer("reject-flow");
  const slug = await rad.product();
  const order = await submitReceipt(rad, buyer, slug);

  const before = rad.catalogRevalidationCallCount();
  await rad.admin.rejectPayment(order.id, "رسید ناخوانا بود", null);

  const product = await rad.productRow(slug);
  assert.equal(
    product.status,
    "available",
    "a rejected order must return its work to available, not leave it sold",
  );
  assert.equal(product.heldBy, null);
  assert.equal(product.holdExpiresAt, null);

  const adminOrder = await rad.adminOrder(order.id);
  assert.equal(adminOrder.status, "rejected");

  const [ownedOrder] = await rad.orders.list(buyer);
  assert.equal(
    ownedOrder.status,
    "rejected",
    "the customer's own order view must reflect the rejection immediately",
  );

  assert.ok(
    rad.catalogRevalidationCallCount() > before,
    "rejecting a payment must invalidate the storefront catalog cache",
  );
});

test("admin manually cancelling an order restocks the work and notifies the storefront", async () => {
  const buyer = rad.buyer("manual-cancel");
  const slug = await rad.product();
  const order = await rad.placeOrder(buyer, slug);

  const before = rad.catalogRevalidationCallCount();
  await rad.admin.updateOrder(order.id, { status: "cancelled" });

  const product = await rad.productRow(slug);
  assert.equal(
    product.status,
    "available",
    "a manually cancelled order must return its work to available",
  );

  assert.ok(
    rad.catalogRevalidationCallCount() > before,
    "manually cancelling an order must invalidate the storefront catalog cache " +
      "(this was previously missing: updateOrder restocked inventory but never " +
      "told the storefront, so it could serve a stale sold/unavailable card for " +
      "up to the full process-cache window)",
  );
});

test("a confirmed sale is never reversed by a later unrelated reject", async () => {
  const winner = rad.buyer("winner");
  const slug = await rad.product();
  const order = await submitReceipt(rad, winner, slug);
  await rad.admin.approvePayment(order.id, null);

  const sold = await rad.productRow(slug);
  assert.equal(sold.status, "sold");

  // A stale/duplicate reject attempt on an already-reviewed order must be
  // rejected outright, never silently restock a genuinely sold work.
  await assert.rejects(
    rad.admin.rejectPayment(order.id, "late callback", null),
  );

  const stillSold = await rad.productRow(slug);
  assert.equal(stillSold.status, "sold");
});

test("a duplicate/concurrent reject on an already-rejected order is a no-op, not a second restock", async () => {
  const buyer = rad.buyer("double-reject");
  const slug = await rad.product();
  const order = await submitReceipt(rad, buyer, slug);

  await rad.admin.rejectPayment(order.id, "اولین رد", null);
  await assert.rejects(
    rad.admin.rejectPayment(order.id, "دومین رد", null),
    "a second review of an already-rejected order must be refused, not re-applied",
  );
});
