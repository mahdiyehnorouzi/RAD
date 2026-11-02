import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { BadRequestException, ConflictException } from "@nestjs/common";
import { CartItem, Order, Product } from "../database/entities";
import { ownerKey } from "../common/identity";
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

function codeOf(error: unknown) {
  assert.ok(
    error instanceof ConflictException || error instanceof BadRequestException,
  );
  const body = error.getResponse();
  assert.equal(typeof body, "object");
  return body as { code?: string; orderId?: string };
}

test("two guests cannot both reserve one work; the loser is told it is someone else's hold", async () => {
  const slug = await rad.product();
  const first = rad.buyer("first");
  const second = rad.buyer("second");
  const results = await Promise.allSettled([
    rad.cart.add(first, slug),
    rad.cart.add(second, slug),
  ]);
  const won = results.filter((result) => result.status === "fulfilled");
  const lost = results.filter((result) => result.status === "rejected");
  assert.equal(won.length, 1);
  assert.equal(lost.length, 1);
  assert.equal(codeOf(lost[0].reason).code, "reserved_by_other");

  const row = await rad.productRow(slug);
  assert.equal(row.status, "sold");
  assert.ok(row.heldBy === ownerKey(first) || row.heldBy === ownerKey(second));
  const carts = await rad.dataSource.getRepository(CartItem).find({
    where: { productSlug: slug },
  });
  assert.equal(carts.length, 1);
});

test("the same guest adding twice keeps a single hold and a single bag row", async () => {
  const slug = await rad.product();
  const buyer = rad.buyer("same");
  const [first, second] = await Promise.all([
    rad.cart.add(buyer, slug),
    rad.cart.add(buyer, slug),
  ]);
  assert.deepEqual(first.slugs, [slug]);
  assert.deepEqual(second.slugs, [slug]);
  const rows = await rad.dataSource.getRepository(CartItem).count({
    where: { ownerKey: ownerKey(buyer), productSlug: slug },
  });
  assert.equal(rows, 1);
  const orders = await rad.dataSource.getRepository(Order).count({
    where: { ownerKey: ownerKey(buyer) },
  });
  assert.equal(orders, 0);
});

test("checkout moves the bag onto one pending order and a later add or checkout does not duplicate it", async () => {
  const slug = await rad.product();
  const buyer = rad.buyer("back");
  const order = await rad.placeOrder(buyer, slug);
  const bag = await rad.cart.get(buyer);
  assert.deepEqual(bag.slugs, []);
  assert.equal(bag.pendingOrders.length, 1);
  assert.equal(bag.pendingOrders[0]?.id, order.id);
  assert.deepEqual(bag.pendingOrders[0]?.slugs, [slug]);

  const row = await rad.productRow(slug);
  assert.equal(row.status, "sold");
  assert.equal(row.heldBy, ownerKey(buyer));

  await assert.rejects(
    () =>
      rad.orders.checkout(buyer, {
        name: "مشتری آزمایشی",
        phone: "09121234567",
        city: "تهران",
        address: "خیابان ولیعصر",
        acceptedPolicies: rad.acceptedPolicies,
      }),
    (error: unknown) => {
      assert.equal(codeOf(error).code, "cart_empty");
      return true;
    },
  );
  await assert.rejects(
    () => rad.cart.add(buyer, slug),
    (error: unknown) => {
      const body = codeOf(error);
      assert.equal(body.code, "reserved_for_you");
      assert.equal(body.orderId, order.id);
      return true;
    },
  );

  assert.equal(
    await rad.dataSource.getRepository(Order).count({
      where: { ownerKey: ownerKey(buyer) },
    }),
    1,
  );
  assert.equal(
    await rad.dataSource.getRepository(CartItem).count({
      where: { ownerKey: ownerKey(buyer) },
    }),
    0,
  );
  const still = await rad.productRow(slug);
  assert.equal(still.status, "sold");
  assert.equal(still.heldBy, ownerKey(buyer));
});

test("an expired cart hold returns to the shop and can be reserved again without a second order", async () => {
  const slug = await rad.product();
  const buyer = rad.buyer("expired");
  await rad.cart.add(buyer, slug);
  await rad.dataSource
    .getRepository(Product)
    .update({ slug }, { holdExpiresAt: new Date(Date.now() - 1000) });
  const released = await rad.inventory.releaseExpiredHolds();
  assert.ok(released.includes(slug));

  const bag = await rad.cart.get(buyer);
  assert.deepEqual(bag.slugs, []);
  assert.deepEqual(bag.pendingOrders, []);
  const freed = await rad.productRow(slug);
  assert.equal(freed.status, "available");
  assert.equal(freed.heldBy, null);

  const again = await rad.cart.add(buyer, slug);
  assert.deepEqual(again.slugs, [slug]);
  assert.equal(
    await rad.dataSource.getRepository(Order).count({
      where: { ownerKey: ownerKey(buyer) },
    }),
    0,
  );
});

test("a pending order past its payment window is not offered for resume after the sweep", async () => {
  const slug = await rad.product();
  const buyer = rad.buyer("window");
  const order = await rad.placeOrder(buyer, slug);
  const past = new Date(Date.now() - 1000);
  await rad.dataSource
    .getRepository(Order)
    .update({ id: order.id }, { paymentDueAt: past });
  await rad.dataSource
    .getRepository(Product)
    .update({ slug }, { holdExpiresAt: past });
  const bag = await rad.cart.get(buyer);
  assert.deepEqual(bag.slugs, []);
  assert.deepEqual(bag.pendingOrders, []);
  const row = await rad.productRow(slug);
  assert.equal(row.status, "available");
  const saved = await rad.dataSource.getRepository(Order).findOneByOrFail({
    id: order.id,
  });
  assert.equal(saved.status, "expired");
});
