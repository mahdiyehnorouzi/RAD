import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveVisibleSlide } from "./resolve-visible-slide";

test("with no pending target (a touch swipe), any report is accepted", () => {
  assert.equal(resolveVisibleSlide(2, null), 2);
  assert.equal(resolveVisibleSlide(0, null), 0);
});

test("while a button tap's scroll is pending, an intermediate slide it merely passes through is ignored", () => {
  // Previous/Next tapped from slide 0 toward slide 2 - the animated scroll
  // passes through slide 1 along the way.
  assert.equal(resolveVisibleSlide(1, 2), null);
});

test("once the observer confirms arrival at the requested target, it's accepted", () => {
  assert.equal(resolveVisibleSlide(2, 2), 2);
});

test("a report for neither the old nor the pending slide (e.g. a rapid second tap) is still ignored until it matches", () => {
  assert.equal(resolveVisibleSlide(0, 2), null);
});
