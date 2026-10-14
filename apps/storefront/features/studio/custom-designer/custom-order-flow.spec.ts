import { test } from "node:test";
import assert from "node:assert/strict";
import { phaseFromFlowScreen } from "./type/order-phase";
import { sectionOrder } from "./type/choices-section";
import { validDimension, validFutureDate } from "./hooks/use-designer";

test("phaseFromFlowScreen groups every idea screen under the Idea phase", () => {
  for (const screen of ["choose", "write", "photo", "voice", "more"] as const) {
    assert.equal(phaseFromFlowScreen(screen), "idea");
  }
});

test("phaseFromFlowScreen maps the review screen to the Review phase", () => {
  assert.equal(phaseFromFlowScreen("review"), "review");
});

test("phaseFromFlowScreen groups every remaining screen under Choices", () => {
  for (const screen of [
    "form",
    "size",
    "color",
    "similarity",
    "budget",
    "time",
  ] as const) {
    assert.equal(phaseFromFlowScreen(screen), "choices");
  }
});

test("sectionOrder omits the similarity section without a reference", () => {
  assert.deepEqual(sectionOrder(false), [
    "category",
    "size",
    "color",
    "budget",
    "timeline",
  ]);
});

test("sectionOrder inserts similarity right after color when a reference exists", () => {
  const order = sectionOrder(true);
  assert.deepEqual(order, [
    "category",
    "size",
    "color",
    "similarity",
    "budget",
    "timeline",
  ]);
  assert.equal(order.indexOf("similarity"), order.indexOf("color") + 1);
});

test("validDimension accepts empty input (dimensions are optional)", () => {
  assert.equal(validDimension(""), true);
  assert.equal(validDimension("   "), true);
});

test("validDimension rejects zero, negative, and non-numeric input", () => {
  assert.equal(validDimension("0"), false);
  assert.equal(validDimension("-3"), false);
  assert.equal(validDimension("abc"), false);
});

test("validDimension accepts Persian/Arabic-Indic digits", () => {
  assert.equal(validDimension("۱۲"), true);
  assert.equal(validDimension("١٢"), true);
});

test("validFutureDate rejects malformed and past dates", () => {
  assert.equal(validFutureDate("not-a-date"), false);
  assert.equal(validFutureDate("2000-01-01"), false);
});

test("validFutureDate accepts a date well in the future", () => {
  assert.equal(validFutureDate("2099-01-01"), true);
});
