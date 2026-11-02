import { test } from "node:test";
import assert from "node:assert/strict";
import { shouldMountOverlay } from "./should-mount-overlay";

test("does not mount before a card is opened or the browser goes idle", () => {
  assert.equal(shouldMountOverlay(false, false), false);
});

test("mounts immediately once a card is opened, regardless of the idle timer", () => {
  assert.equal(shouldMountOverlay(true, false), true);
});

test("mounts once idle, even if no card has been opened yet", () => {
  assert.equal(shouldMountOverlay(false, true), true);
});

test("stays mounted once both have fired", () => {
  assert.equal(shouldMountOverlay(true, true), true);
});
