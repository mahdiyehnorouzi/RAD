import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { CartItem, Product } from "../database/entities";
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

test("get returns an empty snapshot for a new owner", async () => {
  const cart = await rad.cart.get(rad.buyer("empty-cart"));
  assert.deepEqual(cart, { slugs: [], holds: {}, prices: {} });
});

test("add snapshots current product prices, even after catalog price changes", async () => {
  const owner = rad.buyer("price-snapshot");
  const slug = await rad.product(8_500_000);
  const row = await rad.productRow(slug);

  const added = await rad.cart.add(owner, slug);
  assert.deepEqual(added.slugs, [slug]);
  assert.deepEqual(added.prices[slug], {
    toman: row.tomanPrice,
    usd: row.usdPrice,
  });
  assert.ok(added.holds[slug] > Date.now());

  await rad.dataSource.getRepository(Product).update(
    { slug },
    { tomanPrice: 9_900_000, usdPrice: 200 },
  );
  const again = await rad.cart.get(owner);
  assert.deepEqual(again.prices[slug], added.prices[slug]);

  const stored = await rad.dataSource.getRepository(CartItem).findOneOrFail({
    where: { productSlug: slug },
  });
  assert.equal(stored.tomanPriceAtAdd, row.tomanPrice);
  assert.equal(stored.usdPriceAtAdd, row.usdPrice);
});

test("remove deletes the owner's item and releases its hold", async () => {
  const owner = rad.buyer("remove-cart");
  const slug = await rad.product();
  await rad.cart.add(owner, slug);

  const removed = await rad.cart.remove(owner, slug);
  assert.deepEqual(removed.slugs, []);
  assert.equal(
    await rad.dataSource.getRepository(CartItem).count({
      where: { productSlug: slug },
    }),
    0,
  );
  const product = await rad.productRow(slug);
  assert.equal(product.status, "available");
  assert.equal(product.heldBy, null);
});

test("remove of a missing cart item leaves other items unchanged", async () => {
  const owner = rad.buyer("remove-absent");
  const slug = await rad.product();
  const otherSlug = await rad.product();
  await rad.cart.add(owner, slug);

  const snapshot = await rad.cart.remove(owner, otherSlug);
  assert.deepEqual(snapshot.slugs, [slug]);
  assert.equal((await rad.productRow(slug)).status, "held");
});

test("clear removes all owned items and holds and tolerates an empty cart", async () => {
  const owner = rad.buyer("clear-cart");
  const slugs = [await rad.product(), await rad.product()];
  for (const slug of slugs) await rad.cart.add(owner, slug);

  assert.deepEqual((await rad.cart.clear(owner)).slugs, []);
  assert.deepEqual((await rad.cart.clear(owner)).slugs, []);
  for (const slug of slugs) {
    const row = await rad.productRow(slug);
    assert.equal(row.status, "available");
    assert.equal(row.heldBy, null);
  }
});

test("other owners cannot remove or clear someone else's cart", async () => {
  const owner = rad.buyer("isolated-owner");
  const intruder = rad.buyer("isolated-intruder");
  const slug = await rad.product();
  await rad.cart.add(owner, slug);

  assert.deepEqual((await rad.cart.remove(intruder, slug)).slugs, []);
  assert.deepEqual((await rad.cart.clear(intruder)).slugs, []);
  assert.deepEqual((await rad.cart.get(owner)).slugs, [slug]);
  assert.ok((await rad.cart.get(owner)).holds[slug] > Date.now());
});

test("get expires abandoned holds before building the snapshot", async () => {
  const owner = rad.buyer("expired-cart");
  const slug = await rad.product();
  await rad.cart.add(owner, slug);

  await rad.dataSource.getRepository(Product).update(
    { slug },
    { holdExpiresAt: new Date(Date.now() - 1) },
  );

  const snapshot = await rad.cart.get(owner);
  assert.deepEqual(snapshot.slugs, []);
  assert.deepEqual(snapshot.holds, {});
  const product = await rad.productRow(slug);
  assert.equal(product.status, "available");
  assert.equal(product.heldBy, null);
});
