import assert from "node:assert/strict";
import { test } from "node:test";
import { seedCheckoutName, seedCheckoutPhone } from "./checkout-contact";

test("a checkout draft wins over the profile prefill, and typing wins over both", () => {
  assert.equal(
    seedCheckoutName({
      current: "از حساب",
      draftName: "از پیش‌نویس",
      profileName: "از حساب",
    }),
    "از پیش‌نویس",
  );
  assert.equal(
    seedCheckoutName({
      current: "تایپ‌شده",
      draftName: "از پیش‌نویس",
      profileName: "از حساب",
    }),
    "تایپ‌شده",
  );
  assert.equal(
    seedCheckoutName({
      current: "",
      draftName: "",
      profileName: "از حساب",
    }),
    "",
  );
  assert.equal(
    seedCheckoutPhone({
      current: "",
      profilePhone: "09121234567",
    }),
    "0912 123 4567",
  );
  assert.equal(
    seedCheckoutPhone({
      current: "",
      draftPhone: "",
      profilePhone: "09121234567",
    }),
    "",
  );
  assert.equal(
    seedCheckoutPhone({
      current: "",
      draftPhone: "09120000000",
      profilePhone: "09121234567",
    }),
    "0912 000 0000",
  );
});

test("an empty profile does not invent a checkout phone", () => {
  assert.equal(seedCheckoutPhone({ current: "", profilePhone: null }), "");
  assert.equal(seedCheckoutName({ current: "", profileName: "  " }), "");
});
