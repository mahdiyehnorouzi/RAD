import assert from "node:assert/strict";
import { test } from "node:test";
import { effectiveProductStatus } from "./index";

const now = 1_000_000;

test("available status is always available, regardless of reservedUntil", () => {
  assert.equal(
    effectiveProductStatus({ status: "available" }, now),
    "available",
  );
  assert.equal(
    effectiveProductStatus({ status: "available", reservedUntil: now + 1 }, now),
    "available",
  );
});

test("sold with a future reservedUntil is reserved, not sold", () => {
  assert.equal(
    effectiveProductStatus({ status: "sold", reservedUntil: now + 1 }, now),
    "reserved",
  );
});

test("sold with an elapsed or missing reservedUntil is sold", () => {
  assert.equal(
    effectiveProductStatus({ status: "sold", reservedUntil: now - 1 }, now),
    "sold",
  );
  assert.equal(effectiveProductStatus({ status: "sold" }, now), "sold");
});

test("draft/in_workshop/ready/archived all collapse to unavailable", () => {
  for (const status of ["draft", "in_workshop", "ready", "archived"] as const) {
    assert.equal(effectiveProductStatus({ status }, now), "unavailable");
  }
});

test("defaults `now` to the current time when omitted", () => {
  const soon = Date.now() + 60_000;
  assert.equal(
    effectiveProductStatus({ status: "sold", reservedUntil: soon }),
    "reserved",
  );
});
