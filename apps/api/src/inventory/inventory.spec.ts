import assert from "node:assert/strict";
import { after, before, test } from "node:test";
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

test("concurrent sweeps reuse the same in-flight run instead of opening overlapping transactions", async () => {
  const first = rad.inventory.releaseExpiredHolds();
  const second = rad.inventory.releaseExpiredHolds();
  assert.equal(
    first,
    second,
    "a sweep already running must be shared, not duplicated, by a call that arrives while it is in flight",
  );
  await first;

  // Once settled, the next call starts a fresh run rather than reusing a
  // finished one forever.
  const third = rad.inventory.releaseExpiredHolds();
  assert.notEqual(first, third);
  await third;
});

test("onModuleInit starts the sweep timer and onModuleDestroy stops it", async () => {
  await rad.inventory.onModuleInit();
  const timerAfterInit = (rad.inventory as unknown as { sweepTimer: unknown })
    .sweepTimer;
  assert.ok(timerAfterInit, "a sweep timer must be scheduled after init");

  rad.inventory.onModuleDestroy();
  const timerAfterDestroy = (
    rad.inventory as unknown as { sweepTimer: unknown }
  ).sweepTimer;
  assert.equal(
    timerAfterDestroy,
    null,
    "the sweep timer must be cleared on shutdown so a killed/restarted " +
      "process cannot leave a dangling interval behind",
  );
});
