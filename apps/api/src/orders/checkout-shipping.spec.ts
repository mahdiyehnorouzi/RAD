import assert from "node:assert/strict";
import { test } from "node:test";
import { EXPRESS_POST_FEE_TOMAN } from "@rad/types";
import {
  isTehranDeliveryCity,
  quoteCheckoutShipping,
} from "./checkout-shipping";

test("Express Post is a flat 150,000 tomans and ignores any client fee", () => {
  assert.equal(EXPRESS_POST_FEE_TOMAN, 150_000);
  const quoted = quoteCheckoutShipping("express", "اصفهان، اصفهان");
  assert.equal(quoted.ok, true);
  if (!quoted.ok) return;
  assert.equal(quoted.feeToman, 150_000);
  assert.equal(quoted.method, "express");
});

test("courier is free until dispatch and only for Tehran", () => {
  assert.equal(isTehranDeliveryCity("تهران، تهران"), true);
  assert.equal(isTehranDeliveryCity("تهران"), true);
  assert.equal(isTehranDeliveryCity("تهران، شهریار"), false);
  assert.equal(isTehranDeliveryCity("البرز، کرج"), false);

  const tehran = quoteCheckoutShipping("courier", "تهران، تهران");
  assert.equal(tehran.ok && tehran.feeToman, 0);
  const outside = quoteCheckoutShipping("courier", "البرز، کرج");
  assert.equal(outside.ok, false);
  if (!outside.ok) assert.equal(outside.code, "courier_tehran_only");
});

test("an omitted method adds no shipping fee", () => {
  const quoted = quoteCheckoutShipping(undefined, "تهران، تهران");
  assert.deepEqual(quoted, { ok: true, method: null, feeToman: 0 });
});
