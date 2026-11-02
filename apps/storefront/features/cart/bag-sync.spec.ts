import assert from "node:assert/strict";
import { test } from "node:test";
import type { CartPendingOrder } from "@rad/types";
import {
  createCartQueue,
  isCurrentCartEpoch,
  pendingOrderForSlug,
  readBagMemory,
  reconcileBagBaseline,
  sessionOwnerFromEvent,
  shouldReloadBagOnPageShow,
  slugsThatLeftBag,
} from "./bag-sync";

const order = (
  slugs: string[],
  paymentDueAt: number | null,
): CartPendingOrder => ({
  id: "ord-1",
  status: "pending_payment",
  paymentDueAt,
  slugs,
});

test("backing out of an unpaid order does not treat the transferred work as released", () => {
  const left = slugsThatLeftBag(
    ["bowl"],
    [],
    [order(["bowl"], Date.now() + 60_000)],
  );
  assert.deepEqual(left, []);
});

test("a hold that actually expired is still reported as released", () => {
  assert.deepEqual(slugsThatLeftBag(["bowl"], [], []), ["bowl"]);
});

test("a session with no previous bag reports nothing released", () => {
  assert.deepEqual(slugsThatLeftBag(null, [], [order(["bowl"], null)]), []);
});

test("an expired pending order is not a resume target", () => {
  const now = 1_000_000;
  assert.equal(
    pendingOrderForSlug([order(["bowl"], now - 1)], "bowl", now),
    null,
  );
  assert.equal(
    pendingOrderForSlug([order(["bowl"], now + 1)], "bowl", now)?.id,
    "ord-1",
  );
});

test("pageshow reloads the bag, including a Safari bfcache restore", () => {
  assert.equal(shouldReloadBagOnPageShow(), true);
});

test("a different visitor does not inherit the previous bag", () => {
  const previous = reconcileBagBaseline(
    { owner: "user:a", slugs: ["bowl"], released: ["cup"] },
    "guest:b",
    [],
    [],
    "detect",
  );
  assert.deepEqual(previous, {
    owner: "guest:b",
    slugs: [],
    released: [],
  });
});

test("an expired hold is remembered for the same visitor", () => {
  const next = reconcileBagBaseline(
    { owner: "guest:b", slugs: ["bowl"], released: [] },
    "guest:b",
    [],
    [],
    "detect",
  );
  assert.deepEqual(next.released, ["bowl"]);
});

test("a work that moved onto an unpaid order is not remembered as released", () => {
  const next = reconcileBagBaseline(
    { owner: "guest:b", slugs: ["bowl"], released: [] },
    "guest:b",
    [],
    [order(["bowl"], Date.now() + 60_000)],
    "detect",
  );
  assert.deepEqual(next.released, []);
});

test("adding a work back clears it from the released list without detecting new departures", () => {
  const next = reconcileBagBaseline(
    { owner: "guest:b", slugs: [], released: ["bowl", "cup"] },
    "guest:b",
    ["bowl"],
    [],
    "keep",
  );
  assert.deepEqual(next.released, ["cup"]);
  assert.deepEqual(next.slugs, ["bowl"]);
});

test("a session change drops the previous released list", () => {
  const next = reconcileBagBaseline(
    { owner: "user:a", slugs: ["bowl"], released: ["cup"] },
    "user:a",
    [],
    [],
    "reset",
  );
  assert.deepEqual(next.released, []);
});

test("a cart response from an older session is not current", () => {
  assert.equal(isCurrentCartEpoch(1, 1), true);
  assert.equal(isCurrentCartEpoch(1, 2), false);
});

test("cart tasks run one at a time and a failure does not block the next snapshot", async () => {
  const enqueue = createCartQueue();
  const order: string[] = [];
  let releaseRead!: () => void;
  const read = enqueue(
    () =>
      new Promise<void>((resolve) => {
        order.push("read-start");
        releaseRead = () => {
          order.push("read-apply");
          resolve();
        };
      }),
  );
  const write = enqueue(async () => {
    order.push("write-start");
    order.push("write-apply");
  });
  await Promise.resolve();
  assert.deepEqual(order, ["read-start"]);
  releaseRead();
  await Promise.all([read, write]);
  assert.deepEqual(order, [
    "read-start",
    "read-apply",
    "write-start",
    "write-apply",
  ]);

  await assert.rejects(enqueue(() => Promise.reject(new Error("offline"))));
  assert.equal(await enqueue(async () => "fresh"), "fresh");
});

test("session events name the visitor, and legacy bag lists are discarded", () => {
  assert.deepEqual(sessionOwnerFromEvent({ userId: "user-1" }, "guest-1"), {
    known: true,
    owner: "user:user-1",
  });
  assert.deepEqual(sessionOwnerFromEvent({ userId: null }, "guest-1"), {
    known: true,
    owner: "guest:guest-1",
  });
  assert.deepEqual(sessionOwnerFromEvent(undefined, "guest-1"), {
    known: false,
  });

  const storage = new Map<string, string>([
    ["rad-cart-known", JSON.stringify(["bowl"])],
    ["rad-cart-released", JSON.stringify(["cup"])],
    [
      "rad-cart-bag",
      JSON.stringify({ owner: "guest:guest-1", slugs: [], released: [] }),
    ],
  ]);
  const memory = readBagMemory({
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => {
      storage.set(key, value);
    },
    removeItem: (key) => {
      storage.delete(key);
    },
  });
  assert.deepEqual(memory, {
    owner: "guest:guest-1",
    slugs: [],
    released: [],
  });
  assert.equal(storage.has("rad-cart-known"), false);
  assert.equal(storage.has("rad-cart-released"), false);
});
