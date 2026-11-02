import assert from "node:assert/strict";
import { test } from "node:test";
import type { CartPendingOrder } from "@rad/types";
import {
  adoptVisitor,
  createCartQueue,
  isCurrentCartEpoch,
  pendingOrderForSlug,
  readBagMemory,
  reconcileBagBaseline,
  runQueuedCartMutation,
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

test("learning the visitor does not retire the read already in flight", () => {
  const adopted = adoptVisitor(
    { owner: null, epoch: 0, resetBaseline: false },
    "user:1",
  );
  assert.equal(adopted.reload, false);
  assert.equal(adopted.clock.owner, "user:1");
  assert.equal(adopted.clock.epoch, 0);
});

test("a visitor change is stored before a reload would start", () => {
  const adopted = adoptVisitor(
    { owner: "guest:old", epoch: 2, resetBaseline: false },
    "user:new",
  );
  assert.equal(adopted.reload, true);
  assert.deepEqual(adopted.clock, {
    owner: "user:new",
    epoch: 3,
    resetBaseline: true,
  });
});

test("the same visitor keeps the epoch, including a baseline reset already requested", () => {
  const adopted = adoptVisitor(
    { owner: "user:new", epoch: 3, resetBaseline: true },
    "user:new",
  );
  assert.equal(adopted.reload, false);
  assert.equal(adopted.clock.epoch, 3);
  assert.equal(adopted.clock.resetBaseline, true);
});

test("a mutation waiting behind another request is not sent after the session changes", async () => {
  const enqueue = createCartQueue();
  let epoch = 1;
  const calls: string[] = [];
  let release!: () => void;
  const blocking = enqueue(
    () =>
      new Promise<void>((resolve) => {
        release = resolve;
      }),
  );
  const stale = runQueuedCartMutation(
    enqueue,
    epoch,
    () => epoch,
    async () => {
      calls.push("stale-request");
    },
    () => {
      calls.push("stale-apply");
    },
  );
  epoch += 1;
  epoch += 1;
  const current = runQueuedCartMutation(
    enqueue,
    epoch,
    () => epoch,
    async () => {
      calls.push("current-request");
      return "ok";
    },
    () => {
      calls.push("current-apply");
    },
  );
  await Promise.resolve();
  release();
  await blocking;
  assert.equal(await stale, false);
  assert.equal(await current, true);
  assert.deepEqual(calls, ["current-request", "current-apply"]);
});

test("a request already sent is not applied after a session change, and a failure does not block the next one", async () => {
  const enqueue = createCartQueue();
  let epoch = 1;
  let applied = "";
  let release!: () => void;
  const inFlight = runQueuedCartMutation(
    enqueue,
    epoch,
    () => epoch,
    () =>
      new Promise<string>((resolve) => {
        release = () => {
          epoch += 1;
          resolve("old");
        };
      }),
    (value) => {
      applied = value;
    },
  );
  await Promise.resolve();
  release();
  assert.equal(await inFlight, false);
  assert.equal(applied, "");

  await assert.rejects(
    runQueuedCartMutation(
      enqueue,
      epoch,
      () => epoch,
      () => Promise.reject(new Error("offline")),
      () => {
        applied = "failed";
      },
    ),
  );
  assert.equal(
    await runQueuedCartMutation(
      enqueue,
      epoch,
      () => epoch,
      async () => "fresh",
      (value) => {
        applied = value;
      },
    ),
    true,
  );
  assert.equal(applied, "fresh");
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
