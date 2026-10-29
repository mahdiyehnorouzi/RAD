import assert from "node:assert/strict";
import { test } from "node:test";
import {
  cardDigitsForCopy,
  cardNumberGroups,
  holderNameLines,
} from "./receipt";

test("cardNumberGroups splits 16 digits into four LTR groups", () => {
  assert.deepEqual(cardNumberGroups("6037-9981-5566-7788"), [
    "6037",
    "9981",
    "5566",
    "7788",
  ]);
});

test("cardNumberGroups accepts Persian digits and ignores spaces", () => {
  assert.deepEqual(cardNumberGroups("۶۰۳۷ ۹۹۸۱ ۵۵۶۶ ۷۷۸۸"), [
    "6037",
    "9981",
    "5566",
    "7788",
  ]);
});

test("cardDigitsForCopy strips separators so bank apps receive 16 digits", () => {
  assert.equal(cardDigitsForCopy("6037 9981-5566 7788"), "6037998155667788");
});

test("holderNameLines keeps a two-part cardholder name instead of a brand alias", () => {
  assert.deepEqual(holderNameLines("مهدیه نوروزی"), ["مهدیه", "نوروزی"]);
  assert.deepEqual(holderNameLines("استودیو رَد"), ["استودیو", "رَد"]);
});
