import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canonicalIranMobile,
  formatIranMobileDraft,
  iranMobileMessage,
} from "./iran-mobile";

const copy = {
  empty: "شماره موبایل را بنویسید.",
  invalid: "شماره موبایل را با ۰۹ و یازده رقم بنویسید؛ مثلاً ۰۹۱۲۱۲۳۴۵۶۷.",
};

test("Persian, Arabic, and Latin mobiles become 09 and nine digits", () => {
  assert.equal(canonicalIranMobile("۰۹۱۲۱۲۳۴۵۶۷"), "09121234567");
  assert.equal(canonicalIranMobile("٠٩١٢١٢٣٤٥٦٧"), "09121234567");
  assert.equal(canonicalIranMobile("0912 123 4567"), "09121234567");
  assert.equal(canonicalIranMobile("+98 912 123 4567"), "09121234567");
  assert.equal(canonicalIranMobile("00989121234567"), "09121234567");
  assert.equal(canonicalIranMobile("9121234567"), "09121234567");
});

test("empty, short, long, and landline numbers are rejected", () => {
  assert.equal(canonicalIranMobile(""), null);
  assert.equal(canonicalIranMobile("0912"), null);
  assert.equal(canonicalIranMobile("091212345678"), null);
  assert.equal(canonicalIranMobile("02112345678"), null);
});

test("typing normalizes digits, and the error waits until the field is touched", () => {
  assert.equal(formatIranMobileDraft("۰۹۱۲۱۲۳۴۵۶۷"), "0912 123 4567");
  assert.equal(formatIranMobileDraft("09121"), "0912 1");
  assert.equal(iranMobileMessage("", false, copy), undefined);
  assert.equal(iranMobileMessage("0912", false, copy), undefined);
  assert.equal(iranMobileMessage("", true, copy), copy.empty);
  assert.equal(iranMobileMessage("0912", true, copy), copy.invalid);
  assert.equal(iranMobileMessage("09121234567", true, copy), undefined);
});
