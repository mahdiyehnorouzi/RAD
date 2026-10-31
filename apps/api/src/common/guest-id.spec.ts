import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveGuestId } from "./guest-id";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

test("parallel cookieless calls adopt one client guest id instead of minting two", () => {
  const first = resolveGuestId({ header: A, mint: () => B });
  const second = resolveGuestId({ header: A, mint: () => B });
  assert.equal(first.id, A);
  assert.equal(second.id, A);
  assert.equal(first.setCookie, true);
});

test("an existing guest cookie is kept even when the header names someone else", () => {
  const resolved = resolveGuestId({
    cookie: A,
    header: B,
    mint: () => B,
  });
  assert.deepEqual(resolved, { id: A, setCookie: false });
});

test("a missing or invalid cookie falls through to a single minted id", () => {
  const resolved = resolveGuestId({
    cookie: "not-a-uuid",
    header: "also-no",
    mint: () => A,
  });
  assert.deepEqual(resolved, { id: A, setCookie: true });
});
