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

test("a product name that merely contains digits is never treated as a RAD number", () => {
  // A product genuinely named with digits in it ("model 82", an artist
  // whose name has a year in it, …) must stay a name-only search — it
  // must not *also* match identity #82 just because "82" appears inside
  // otherwise non-numeric text.
  assert.equal(parseIdentitySearchQuery("فنجان82").radNumber, null);
  assert.equal(parseIdentitySearchQuery("82-مدل").radNumber, null);
  assert.equal(parseIdentitySearchQuery("test82abc").radNumber, null);
  assert.equal(parseIdentitySearchQuery("82 کوچک").radNumber, null);
});

test("a product name that only starts with letters resembling the RAD prefix stays a name search", () => {
  // "radiant" or "Radin" are real product/artist names — stripping "rad"
  // must not fire unless everything left over is purely numeric.
  assert.equal(parseIdentitySearchQuery("radiant bowl").radNumber, null);
  assert.equal(parseIdentitySearchQuery("Radin").radNumber, null);
});

test("garbage after a RAD- prefix is not treated as a numeric code", () => {
  assert.equal(parseIdentitySearchQuery("RAD-082extra").radNumber, null);
  assert.equal(parseIdentitySearchQuery("RAD-").radNumber, null);
});
