import assert from "node:assert/strict";
import { test } from "node:test";
import {
  mergeFreshCommission,
  mergeFreshCommissions,
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

// BUG-17 (RAD OBJECT Phase 01): two responses for the same commission (two
// messages sent close together, or a mutation response racing the 20s
// poll) can resolve out of order. Applying whichever lands last, unguarded,
// can show older data over state already on screen.
test("a fresher single-item response replaces the current one", () => {
  const current = [commission({ id: "a", updatedAt: 100 })];
  const fresher = commission({ id: "a", updatedAt: 200, messages: [] });
  assert.deepEqual(mergeFreshCommission(current, fresher), [fresher]);
});

test("a stale single-item response (an out-of-order reply) is dropped, not applied", () => {
  const newer = commission({ id: "a", updatedAt: 200 });
  const current = [newer];
  const stale = commission({ id: "a", updatedAt: 100 });
  assert.deepEqual(mergeFreshCommission(current, stale), [newer]);
});

test("mergeFreshCommission never touches a different commission's row", () => {
  const current = [
    commission({ id: "a", updatedAt: 100 }),
    commission({ id: "b", updatedAt: 500 }),
  ];
  const incoming = commission({ id: "a", updatedAt: 999 });
  const merged = mergeFreshCommission(current, incoming);
  assert.equal(merged.find((item) => item.id === "b")?.updatedAt, 500);
});

test("a stale full-list poll response cannot regress a commission newer than it in local state", () => {
  const current = [commission({ id: "a", updatedAt: 500 })];
  const stalePoll = [commission({ id: "a", updatedAt: 100 })];
  assert.deepEqual(
    mergeFreshCommissions(current, stalePoll).map((item) => item.updatedAt),
    [500],
  );
});

test("a fresh full-list poll response still updates a commission", () => {
  const current = [commission({ id: "a", updatedAt: 100 })];
  const freshPoll = [commission({ id: "a", updatedAt: 999 })];
  assert.deepEqual(
    mergeFreshCommissions(current, freshPoll).map((item) => item.updatedAt),
    [999],
  );
});

test("a full-list poll response adds a commission that was not loaded locally yet", () => {
  const current = [commission({ id: "a", updatedAt: 100 })];
  const poll = [
    commission({ id: "a", updatedAt: 100 }),
    commission({ id: "b", updatedAt: 50 }),
  ];
  const merged = mergeFreshCommissions(current, poll);
  assert.deepEqual(merged.map((item) => item.id).sort(), ["a", "b"]);
});
