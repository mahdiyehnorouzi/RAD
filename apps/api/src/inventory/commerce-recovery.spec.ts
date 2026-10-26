import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { ConflictException } from "@nestjs/common";
import { CartItem, Order, PaymentIntent, Product } from "../database/entities";
import {
  startPurchaseHarness,
  type PurchaseHarness,
} from "../orders/testing/purchase-harness";

let rad: PurchaseHarness;
before(async () => {
  rad = await startPurchaseHarness();
});
after(async () => {
  await rad?.stop();
});

test("simultaneous adds by the same buyer succeed with exactly one cart row", async () => {
  const buyer = rad.buyer("parallel-add");
  const slug = await rad.product();
  const results = await Promise.all(
    Array.from({ length: 8 }, () => rad.cart.add(buyer, slug)),
  );
  for (const result of results) assert.deepEqual(result.slugs, [slug]);
  assert.equal(
    await rad.dataSource
      .getRepository(CartItem)
      .count({ where: { productSlug: slug } }),
    1,
  );
});

test("a cart insert failure rolls back its inventory reservation", async () => {
  const slug = await rad.product();
  await rad.dataSource
    .query(`CREATE FUNCTION reject_cart_insert() RETURNS trigger
    LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test cart insert failure'; END $$`);
  await rad.dataSource
    .query(`CREATE TRIGGER reject_cart_insert BEFORE INSERT ON "CartItem"
    FOR EACH ROW EXECUTE FUNCTION reject_cart_insert()`);
  try {
    await assert.rejects(rad.cart.add(rad.buyer("rollback"), slug));
  } finally {
    await rad.dataSource.query('DROP TRIGGER reject_cart_insert ON "CartItem"');
    await rad.dataSource.query("DROP FUNCTION reject_cart_insert()");
  }
  const product = await rad.productRow(slug);
  assert.equal(product.status, "available");
  assert.equal(product.heldBy, null);
});

test("checkout inventory cannot be re-added and released through the cart", async () => {
  const buyer = rad.buyer("ordered");
  const slug = await rad.product();
  await rad.placeOrder(buyer, slug);
  await assert.rejects(rad.cart.add(buyer, slug), ConflictException);
  await rad.cart.clear(buyer);
  assert.equal((await rad.productRow(slug)).status, "sold");
  await assert.rejects(
    rad.cart.add(rad.buyer("other"), slug),
    ConflictException,
  );
});

for (const status of [
  "redirected",
  "submitted",
  "verified",
  "verify_error",
  "verify_conflict",
]) {
  test(`expiry preserves inventory while payment is ${status}`, async () => {
    const buyer = rad.buyer(status);
    const slug = await rad.product();
    const order = await rad.placeOrder(buyer, slug);
    const past = new Date(Date.now() - 60_000);
    await rad.dataSource
      .getRepository(Order)
      .update(order.id, { paymentDueAt: past });
    await rad.dataSource
      .getRepository(Product)
      .update({ slug }, { holdExpiresAt: past });
    await rad.dataSource
      .getRepository(PaymentIntent)
      .update({ orderId: order.id }, { status });
    await rad.inventory.releaseExpiredHolds();
    assert.equal(
      (await rad.orders.get(buyer, order.id)).status,
      "pending_payment",
    );
    assert.equal((await rad.productRow(slug)).status, "sold");
    await assert.rejects(
      rad.cart.add(rad.buyer("late"), slug),
      ConflictException,
    );
  });
}

test("abandoned cart holds still expire and disappear from the cart snapshot", async () => {
  const buyer = rad.buyer("abandoned");
  const slug = await rad.product();
  await rad.cart.add(buyer, slug);
  await rad.dataSource
    .getRepository(Product)
    .update({ slug }, { holdExpiresAt: new Date(Date.now() - 1) });
  assert.deepEqual((await rad.cart.get(buyer)).slugs, []);
  assert.equal((await rad.productRow(slug)).status, "available");
});

test("concurrent checkout creates only one order for the same cart", async () => {
  const buyer = rad.buyer("parallel-checkout");
  const slug = await rad.product();
  await rad.cart.add(buyer, slug);
  const outcomes = await Promise.allSettled(
    Array.from({ length: 4 }, () =>
      rad.orders.checkout(buyer, {
        phone: "09121234567",
        acceptedPolicies: rad.acceptedPolicies,
      }),
    ),
  );
  assert.equal(
    outcomes.filter((result) => result.status === "fulfilled").length,
    1,
  );
  assert.equal((await rad.orders.list(buyer)).length, 1);
});

test("removing a stale cart row cannot release a checkout reservation", async () => {
  const buyer = rad.buyer("stale-cart");
  const slug = await rad.product();
  await rad.placeOrder(buyer, slug);
  const product = await rad.productRow(slug);
  const items = rad.dataSource.getRepository(CartItem);
  await items.save(
    items.create({ ownerKey: product.heldBy!, productSlug: slug }),
  );
  await rad.cart.remove(buyer, slug);
  assert.equal((await rad.productRow(slug)).heldBy, product.heldBy);
  await assert.rejects(
    rad.cart.add(rad.buyer("other"), slug),
    ConflictException,
  );
});
