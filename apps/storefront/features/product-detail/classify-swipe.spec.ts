import { test } from "node:test";
import assert from "node:assert/strict";
import { classifySwipe } from "./classify-swipe";

test("a deliberate leftward drag in LTR advances to the next slide", () => {
  assert.equal(classifySwipe(-80, 2, false), "next");
});

test("a deliberate rightward drag in LTR goes to the previous slide", () => {
  assert.equal(classifySwipe(80, -2, false), "previous");
});

test("direction is mirrored in RTL: rightward advances to next", () => {
  assert.equal(classifySwipe(80, 0, true), "next");
});

test("direction is mirrored in RTL: leftward goes to previous", () => {
  assert.equal(classifySwipe(-80, 0, true), "previous");
});

test("a tap (near-zero movement) is not a swipe", () => {
  assert.equal(classifySwipe(2, -1, false), null);
});

test("a drag shorter than the threshold is not a swipe", () => {
  assert.equal(classifySwipe(30, 0, false, 40), null);
});

test("a mostly-vertical drag is not a swipe, even if long", () => {
  assert.equal(classifySwipe(45, 100, false), null);
});

test("a custom threshold is respected", () => {
  assert.equal(classifySwipe(55, 0, false, 60), null);
  assert.equal(classifySwipe(65, 0, false, 60), "previous");
});
