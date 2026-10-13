import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeIranMobile } from "./contact";

test("accepts a plain Iranian mobile number", () => {
  assert.equal(normalizeIranMobile("09123456789"), "09123456789");
});

test("accepts +98 and 0098 and bare 98 prefixes", () => {
  assert.equal(normalizeIranMobile("+989123456789"), "09123456789");
  assert.equal(normalizeIranMobile("00989123456789"), "09123456789");
  assert.equal(normalizeIranMobile("989123456789"), "09123456789");
});

test("accepts a number without the leading 0", () => {
  assert.equal(normalizeIranMobile("9123456789"), "09123456789");
});

test("normalizes Persian and Arabic digits", () => {
  assert.equal(normalizeIranMobile("۰۹۱۲۳۴۵۶۷۸۹"), "09123456789");
  assert.equal(normalizeIranMobile("٠٩١٢٣٤٥٦٧٨٩"), "09123456789");
});

test("strips spaces and dashes", () => {
  assert.equal(normalizeIranMobile("0912-345-6789"), "09123456789");
  assert.equal(normalizeIranMobile("0912 345 6789"), "09123456789");
});

test("rejects an incomplete number", () => {
  assert.equal(normalizeIranMobile("0912"), null);
});

test("rejects a non-mobile landline-shaped number", () => {
  assert.equal(normalizeIranMobile("02112345678"), null);
});

test("rejects empty input", () => {
  assert.equal(normalizeIranMobile(""), null);
  assert.equal(normalizeIranMobile(undefined), null);
});
