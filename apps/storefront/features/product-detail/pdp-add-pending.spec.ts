import assert from "node:assert/strict";
import { test } from "node:test";
import { addToBagShowsPending } from "@/components/catalog/add-to-bag-pending";

test("add-to-bag pending is local-only when shared pending is not used", () => {
  assert.equal(addToBagShowsPending(undefined, false), false);
  assert.equal(addToBagShowsPending(undefined, true), true);
});

test("add-to-bag pending follows shared PDP pending across both CTAs", () => {
  assert.equal(addToBagShowsPending(false, false), false);
  assert.equal(addToBagShowsPending(true, false), true);
  assert.equal(addToBagShowsPending(false, true), true);
  assert.equal(addToBagShowsPending(true, true), true);
});
