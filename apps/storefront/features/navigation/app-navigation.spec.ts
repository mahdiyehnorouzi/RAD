import assert from "node:assert/strict";
import { test } from "node:test";
import {
  hasNavigatedInApp,
  markAppNavigation,
  resetAppNavigationForTesting,
  shouldMarkNavigation,
} from "./app-navigation";

test("a fresh module load reports no in-app navigation yet (direct hit, refresh, external link)", () => {
  resetAppNavigationForTesting();
  assert.equal(hasNavigatedInApp(), false);
});

test("marking a navigation makes it visible to every reader", () => {
  resetAppNavigationForTesting();
  markAppNavigation();
  assert.equal(hasNavigatedInApp(), true);
});

test("the tracker's first render never counts as a navigation (direct hit, refresh, external link)", () => {
  // AppNavigationTracker seeds `previous` with the pathname already
  // rendered on mount, so the first effect run always compares a pathname
  // against itself.
  assert.equal(
    shouldMarkNavigation("/products/radio-01", "/products/radio-01"),
    false,
  );
});

test("a pathname change after mount is an in-app navigation (an in-site link)", () => {
  assert.equal(shouldMarkNavigation("/products/radio-01", "/cart"), true);
});
