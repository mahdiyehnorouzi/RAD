import assert from "node:assert/strict";
import { test } from "node:test";
import {
  resolveCommissionSelection,
  type AdminCommission,
} from "./admin-data";

function commission(overrides: Partial<AdminCommission>): AdminCommission {
  return {
    id: "RAD-M-1",
    ownerKey: "owner-1",
    customerName: "مشتری",
    artistName: "",
    stage: "design_submitted",
    nextActor: "artist",
    concept: "",
    intendedUse: "",
    material: "",
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    payload: {},
    ...overrides,
  };
}

test("no requested id means no selection (Custom Orders opens on the list)", () => {
  const list = [commission({ id: "a" }), commission({ id: "b" })];
  assert.equal(resolveCommissionSelection(list, null), null);
});

test("an empty list never resolves a selection, regardless of what was requested", () => {
  assert.equal(resolveCommissionSelection([], null), null);
  assert.equal(resolveCommissionSelection([], "a"), null);
});

test("a requested id present in the list is selected", () => {
  const list = [commission({ id: "a" }), commission({ id: "b" })];
  assert.equal(resolveCommissionSelection(list, "b"), "b");
});

test("a requested id no longer in the list (stale deep link) falls back to no selection, not another order", () => {
  const list = [commission({ id: "a" }), commission({ id: "b" })];
  assert.equal(resolveCommissionSelection(list, "stale-id"), null);
});
