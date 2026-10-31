import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizePhone } from "./payment-receipt";

test("checkout stores an Iranian mobile as 09 and nine digits", () => {
  assert.equal(normalizePhone("۰۹۱۲۱۲۳۴۵۶۷"), "09121234567");
  assert.equal(normalizePhone("٠٩١٢١٢٣٤٥٦٧"), "09121234567");
  assert.equal(normalizePhone("0912 123 4567"), "09121234567");
  assert.equal(normalizePhone("+98 912 123 4567"), "09121234567");
  assert.equal(normalizePhone("00989121234567"), "09121234567");
  assert.equal(normalizePhone("9121234567"), "09121234567");
});

test("the server still rejects a phone that is not an Iranian mobile", () => {
  assert.equal(normalizePhone(undefined), null);
  assert.equal(normalizePhone(""), null);
  assert.equal(normalizePhone("0912"), null);
  assert.equal(normalizePhone("091212345678"), null);
  assert.equal(normalizePhone("02112345678"), null);
});
