import { test } from "node:test";
import assert from "node:assert/strict";
import { nextOverlayStack, popOverlayStack } from "./overlay-history";

const a = { slug: "a", href: "/products/a" };
const b = { slug: "b", href: "/products/b" };
const c = { slug: "c", href: "/products/c" };

test("nextOverlayStack: a fresh open from a real page starts a new single-entry stack", () => {
  assert.deepEqual(nextOverlayStack([], a, false), [a]);
  // Even a stale/leftover stack is discarded on a fresh (non-chained) open.
  assert.deepEqual(nextOverlayStack([b, c], a, false), [a]);
});

test("nextOverlayStack: opening a related work from inside the overlay appends", () => {
  assert.deepEqual(nextOverlayStack([a], b, true), [a, b]);
  assert.deepEqual(nextOverlayStack([a, b], c, true), [a, b, c]);
});

test("popOverlayStack: popping the only entry closes the overlay", () => {
  assert.deepEqual(popOverlayStack([a]), { kind: "close" });
  assert.deepEqual(popOverlayStack([]), { kind: "close" });
});

test("popOverlayStack: popping down to another entry retargets to it", () => {
  assert.deepEqual(popOverlayStack([a, b]), {
    kind: "retarget",
    stack: [a],
    entry: a,
  });
});

test("popOverlayStack: a Forward hop back onto a deeper entry also retargets (same operation, read the other way)", () => {
  assert.deepEqual(popOverlayStack([a, b, c]), {
    kind: "retarget",
    stack: [a, b],
    entry: b,
  });
});
