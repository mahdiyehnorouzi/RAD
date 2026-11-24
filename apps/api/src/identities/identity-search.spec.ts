import assert from "node:assert/strict";
import { test } from "node:test";
import { parseIdentitySearchQuery } from "./identity-search";

test("plain ASCII digits pass through unchanged", () => {
  assert.equal(parseIdentitySearchQuery("14").radNumber, "14");
  assert.equal(parseIdentitySearchQuery("  14  ").radNumber, "14");
});

test("Persian digits are normalized to ASCII", () => {
  assert.equal(parseIdentitySearchQuery("۱۴").radNumber, "14");
  assert.equal(parseIdentitySearchQuery("۰۸۲").radNumber, "82");
});

test("Arabic-Indic digits are normalized to ASCII", () => {
  assert.equal(parseIdentitySearchQuery("٠٨٢").radNumber, "82");
});

test("a leading zero is stripped so it matches the unpadded stored number", () => {
  assert.equal(parseIdentitySearchQuery("014").radNumber, "14");
  assert.equal(parseIdentitySearchQuery("۰۱۴").radNumber, "14");
  // All zeros strips down to a single "0" (not an empty, match-everything
  // string) — harmless, since no real radNumber is just "0".
  assert.equal(parseIdentitySearchQuery("000").radNumber, "0");
});

test("a RAD- prefix, in any case or spacing, is stripped", () => {
  assert.equal(parseIdentitySearchQuery("RAD-014").radNumber, "14");
  assert.equal(parseIdentitySearchQuery("rad014").radNumber, "14");
  assert.equal(parseIdentitySearchQuery("Rad 014").radNumber, "14");
  assert.equal(parseIdentitySearchQuery("RAD-۰۱۴").radNumber, "14");
});

test("a query with no digits is a plain product-name search", () => {
  const parsed = parseIdentitySearchQuery("گلدان دوحلقه");
  assert.equal(parsed.radNumber, null);
  assert.equal(parsed.raw, "گلدان دوحلقه");
});

test("an empty or whitespace-only query has no numeric match", () => {
  assert.equal(parseIdentitySearchQuery("").radNumber, null);
  assert.equal(parseIdentitySearchQuery("   ").radNumber, null);
});
