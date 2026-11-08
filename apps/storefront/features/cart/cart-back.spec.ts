import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveCartBackMode } from "./cart-back";

test("cart reached via an in-app navigation replays history", () => {
  assert.equal(resolveCartBackMode(true), "replay-history");
});

test("a direct cart hit, a refresh, or an external link falls back", () => {
  assert.equal(resolveCartBackMode(false), "fallback");
});
