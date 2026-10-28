import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeIranianMobile } from "./phone";

test("accepts the plain 09xxxxxxxxx shape", () => {
  assert.equal(normalizeIranianMobile("09121234567"), "09121234567");
});

test("accepts +98, 0098, and 98 country-code prefixes, normalizing to 09...", () => {
  assert.equal(normalizeIranianMobile("+989121234567"), "09121234567");
  assert.equal(normalizeIranianMobile("00989121234567"), "09121234567");
  assert.equal(normalizeIranianMobile("989121234567"), "09121234567");
});

test("accepts Persian digits and spaces/dashes", () => {
  assert.equal(normalizeIranianMobile("۰۹۱۲ ۱۲۳ ۴۵۶۷"), "09121234567");
  assert.equal(normalizeIranianMobile("0912-123-4567"), "09121234567");
});

test("rejects a number missing the leading 0 with no country code", () => {
  assert.equal(normalizeIranianMobile("9121234567"), null);
});

test("rejects a landline / too-short / too-long / non-numeric input", () => {
  assert.equal(normalizeIranianMobile("02188776655"), null);
  assert.equal(normalizeIranianMobile("0912123"), null);
  assert.equal(normalizeIranianMobile("091212345678"), null);
  assert.equal(normalizeIranianMobile("not-a-phone"), null);
  assert.equal(normalizeIranianMobile(undefined), null);
});
