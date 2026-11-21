import assert from "node:assert/strict";
import { test } from "node:test";
import {
  issuedHighWater,
  nextRadNumberAfter,
} from "../identities/identity.sequence";

/**
 * Number allocation no longer reads MAX(radNumber) and retries on collision.
 * These cases pin the high-water rule the sequence sync uses. Concurrent
 * reservations are covered by the database suite in identities.concurrency.spec.ts.
 */
test("a fresh sequence with no stored numbers issues 1", () => {
  assert.equal(issuedHighWater(1, false, 0), 0);
  assert.equal(nextRadNumberAfter(1, false, 0), 1);
});

test("the next number follows the highest stored number, not a gap", () => {
  assert.equal(nextRadNumberAfter(1, false, 60), 61);
  assert.equal(nextRadNumberAfter(83, true, 60), 84);
});

test("a sequence that is already ahead of the tables is not rewound", () => {
  assert.equal(nextRadNumberAfter(160, true, 60), 161);
});
