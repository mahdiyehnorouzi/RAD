import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { CartItem, Product } from "../database/entities";
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

test("get returns an empty snapshot for a new owner", async () => {
  const cart = await rad.cart.get(rad.buyer("empty-cart"));
  assert.deepEqual(cart, {
    slugs: [],
    holds: {},
    prices: {},
    pendingOrders: [],
  });
});

test("add preserves prices after catalog changes", async () => {
  const owner = rad.buyer("price-snapshot");
  const slug = await rad.product(8_500_000);
  const row = await rad.productRow(slug);

  const added = await rad.cart.add(owner, slug);
  assert.deepEqual(added.slugs, [slug]);
  assert.deepEqual(added.pendingOrders, []);
  assert.deepEqual(added.prices[slug], {
    toman: row.tomanPrice,
    usd: row.usdPrice,
  });
  assert.ok(added.holds[slug] > Date.now());

  const products = rad.dataSource.getRepository(Product);
  await products.update({ slug }, { tomanPrice: 9_900_000, usdPrice: 200 });
  const again = await rad.cart.get(owner);
  assert.deepEqual(again.prices[slug], added.prices[slug]);
  assert.deepEqual(again.pendingOrders, []);

  const stored = await rad.dataSource.getRepository(CartItem).findOneOrFail({
    where: { ownerKey: ownerKey(owner), productSlug: slug },
  });
  assert.equal(stored.tomanPriceAtAdd, row.tomanPrice);
  assert.equal(stored.usdPriceAtAdd, row.usdPrice);
});

test("adding the same work again keeps the original price snapshot", async () => {
  const owner = rad.buyer("price-again");
  const slug = await rad.product(7_000_000);
  const row = await rad.productRow(slug);
  const first = await rad.cart.add(owner, slug);
  await rad.dataSource
    .getRepository(Product)
    .update({ slug }, { tomanPrice: 8_000_000, usdPrice: 90 });

  const again = await rad.cart.add(owner, slug);
  assert.deepEqual(again.slugs, [slug]);
  assert.deepEqual(again.prices[slug], {
    toman: row.tomanPrice,
    usd: row.usdPrice,
  });
  assert.equal(again.holds[slug], first.holds[slug]);
  assert.deepEqual(again.pendingOrders, []);
  assert.equal(
    await rad.dataSource.getRepository(CartItem).count({
      where: { ownerKey: ownerKey(owner), productSlug: slug },
    }),
    1,
  );
});

test("a cart row without stored prices stays listed and omits a price snapshot", async () => {
  const owner = rad.buyer("null-price");
  const slug = await rad.product();
  const items = rad.dataSource.getRepository(CartItem);
  await items.save(
    items.create({
      ownerKey: ownerKey(owner),
      productSlug: slug,
      tomanPriceAtAdd: null,
      usdPriceAtAdd: null,
    }),
  );

  const snapshot = await rad.cart.get(owner);
  assert.deepEqual(snapshot.slugs, [slug]);
  assert.deepEqual(snapshot.prices, {});
  assert.deepEqual(snapshot.holds, {});
  assert.deepEqual(snapshot.pendingOrders, []);
  const product = await rad.productRow(slug);
  assert.equal(product.status, "available");
  assert.equal(product.heldBy, null);
});

test("remove deletes the owner's item and releases its hold", async () => {
  const owner = rad.buyer("remove-cart");
  const slug = await rad.product();
  await rad.cart.add(owner, slug);

  const removed = await rad.cart.remove(owner, slug);
  assert.deepEqual(removed.slugs, []);
  assert.deepEqual(removed.holds, {});
  assert.deepEqual(removed.pendingOrders, []);
  assert.equal(
    await rad.dataSource.getRepository(CartItem).count({
      where: { ownerKey: ownerKey(owner), productSlug: slug },
    }),
    0,
  );
  const product = await rad.productRow(slug);
  assert.equal(product.status, "available");
  assert.equal(product.heldBy, null);
  assert.equal(product.holdExpiresAt, null);
});

test("remove of a missing cart item leaves other items unchanged", async () => {
  const owner = rad.buyer("remove-absent");
  const slug = await rad.product();
  const otherSlug = await rad.product();
  await rad.cart.add(owner, slug);

  const snapshot = await rad.cart.remove(owner, otherSlug);
  assert.deepEqual(snapshot.slugs, [slug]);
  assert.ok(snapshot.holds[slug] > Date.now());
  assert.equal(snapshot.holds[otherSlug], undefined);
  assert.deepEqual(snapshot.pendingOrders, []);
  const kept = await rad.productRow(slug);
  assert.equal(kept.status, "sold");
  assert.equal(kept.heldBy, ownerKey(owner));
  const untouched = await rad.productRow(otherSlug);
  assert.equal(untouched.status, "available");
  assert.equal(untouched.heldBy, null);
});

test("clear releases holds and tolerates an empty cart", async () => {
  const owner = rad.buyer("clear-cart");
  const slugs = [await rad.product(), await rad.product()];
  for (const slug of slugs) await rad.cart.add(owner, slug);

  const cleared = await rad.cart.clear(owner);
  const clearedAgain = await rad.cart.clear(owner);
  assert.deepEqual(cleared.slugs, []);
  assert.deepEqual(cleared.holds, {});
  assert.deepEqual(cleared.pendingOrders, []);
  assert.deepEqual(clearedAgain, cleared);
  assert.equal(
    await rad.dataSource.getRepository(CartItem).count({
      where: { ownerKey: ownerKey(owner) },
    }),
    0,
  );
  for (const slug of slugs) {
    const row = await rad.productRow(slug);
    assert.equal(row.status, "available");
    assert.equal(row.heldBy, null);
    assert.equal(row.holdExpiresAt, null);
  }
});

test("other owners cannot remove or clear someone else's cart", async () => {
  const owner = rad.buyer("isolated-owner");
  const intruder = rad.buyer("isolated-intruder");
  const slug = await rad.product();
  await rad.cart.add(owner, slug);

  const intruderRemove = await rad.cart.remove(intruder, slug);
  const intruderClear = await rad.cart.clear(intruder);
  assert.deepEqual(intruderRemove.slugs, []);
  assert.deepEqual(intruderRemove.pendingOrders, []);
  assert.deepEqual(intruderClear.slugs, []);
  assert.deepEqual(intruderClear.pendingOrders, []);

  const kept = await rad.cart.get(owner);
  assert.deepEqual(kept.slugs, [slug]);
  assert.ok(kept.holds[slug] > Date.now());
  assert.deepEqual(kept.pendingOrders, []);
  const product = await rad.productRow(slug);
  assert.equal(product.status, "sold");
  assert.equal(product.heldBy, ownerKey(owner));
  assert.equal(
    await rad.dataSource.getRepository(CartItem).count({
      where: { ownerKey: ownerKey(owner), productSlug: slug },
    }),
    1,
  );
});

test("get expires abandoned holds before building the snapshot", async () => {
  const owner = rad.buyer("expired-cart");
  const slug = await rad.product();
  await rad.cart.add(owner, slug);

  const products = rad.dataSource.getRepository(Product);
  await products.update({ slug }, { holdExpiresAt: new Date(Date.now() - 1) });

  const snapshot = await rad.cart.get(owner);
  assert.deepEqual(snapshot, {
    slugs: [],
    holds: {},
    prices: {},
    pendingOrders: [],
  });
  assert.equal(
    await rad.dataSource.getRepository(CartItem).count({
      where: { ownerKey: ownerKey(owner), productSlug: slug },
    }),
    0,
  );
  const product = await rad.productRow(slug);
  assert.equal(product.status, "available");
  assert.equal(product.heldBy, null);
  assert.equal(product.holdExpiresAt, null);
});
