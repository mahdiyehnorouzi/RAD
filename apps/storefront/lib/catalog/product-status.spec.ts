import assert from "node:assert/strict";
import { test } from "node:test";
import { isGoneStatus, isReserved } from "./product-status";

const now = 1_000_000;

test("isReserved is true only for a sold product with a future reservedUntil", () => {
  assert.equal(
    isReserved({ status: "sold", reservedUntil: now + 1 }, now),
    true,
  );
  assert.equal(
    isReserved({ status: "sold", reservedUntil: now - 1 }, now),
    false,
  );
  assert.equal(isReserved({ status: "sold" }, now), false);
  assert.equal(isReserved({ status: "available" }, now), false);
});

test("isGoneStatus still treats sold and archived as gone (callers check isReserved first)", () => {
  assert.equal(isGoneStatus("sold"), true);
  assert.equal(isGoneStatus("archived"), true);
  assert.equal(isGoneStatus("available"), false);
});
