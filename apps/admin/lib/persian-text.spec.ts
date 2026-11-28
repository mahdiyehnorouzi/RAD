import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizePersianSearch, persianSearchIncludes } from "./persian-text";

test("diacritics, yeh, kaf, and spacing search as the same Persian word", () => {
  assert.equal(normalizePersianSearch("گُلدان"), "گلدان");
  assert.equal(
    normalizePersianSearch("كوزه\u200cي"),
    normalizePersianSearch("کوزه‌ی"),
  );
  assert.equal(persianSearchIncludes("چایِ داغ", "چاي"), true);
  assert.equal(persianSearchIncludes("کوزه ۲۷", "كوزه ٢٧"), true);
  assert.equal(persianSearchIncludes("گلدان", "فنجان"), false);
});
