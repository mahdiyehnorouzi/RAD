import assert from "node:assert/strict";
import { test } from "node:test";
import { shouldReplayHistory } from "./cart-back";

test("a direct cart hit (single history entry) falls back to a fixed destination", () => {
  assert.equal(shouldReplayHistory(1), false);
  assert.equal(shouldReplayHistory(0), false);
});

test("in-app navigation into the cart replays history instead", () => {
  assert.equal(shouldReplayHistory(2), true);
  assert.equal(shouldReplayHistory(5), true);
});
