import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyIranMobileEdit,
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

test("editing, deleting, and pasting keep the caret on the same digit", () => {
  const typed = applyIranMobileEdit("0912", "09121", 5);
  assert.deepEqual(typed, { value: "0912 1", cursor: 6 });

  const full = "0912 123 4567";
  const removedSpace = applyIranMobileEdit(full, "0912123 4567", 4);
  assert.equal(removedSpace.value, "0911 234 567");
  assert.equal(removedSpace.cursor, 3);

  const inserted = applyIranMobileEdit(full, "0912 9123 4567", 6);
  assert.equal(inserted.value, "0912 912 3456");
  assert.equal(inserted.cursor, 6);

  const pasted = applyIranMobileEdit("", "۰۹۱۲۱۲۳۴۵۶۷", 11);
  assert.equal(pasted.value, "0912 123 4567");
  assert.equal(pasted.cursor, pasted.value.length);

  const international = applyIranMobileEdit("", "+98 912 123 4567", 16);
  assert.equal(international.value, "0912 123 4567");
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
