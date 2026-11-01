import assert from "node:assert/strict";
import { test } from "node:test";
import type { CartPendingOrder } from "@rad/types";
import {
  pendingOrderForSlug,
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
