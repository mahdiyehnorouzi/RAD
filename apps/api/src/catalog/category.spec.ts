import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { ADMIN_CATEGORIES, toAdminCategory, toStoreCategory } from "./category";

describe("toStoreCategory", () => {
  test("maps every admin label to a store category", () => {
    for (const label of ADMIN_CATEGORIES) {
      assert.equal(typeof toStoreCategory(label), "string");
    }
  });

  test("falls back to ceramics for an unknown label", () => {
    assert.equal(toStoreCategory("نامعلوم"), "ceramics");
  });
});

describe("toAdminCategory", () => {
  test("maps a known store category back to a Persian label", () => {
    assert.equal(toAdminCategory("sculpture"), "مجسمه");
    assert.equal(toAdminCategory("painting"), "نقاشی");
  });

  test("falls back to سفال و سرامیک for an unknown value", () => {
    assert.equal(toAdminCategory("unknown"), "سفال و سرامیک");
  });
});
