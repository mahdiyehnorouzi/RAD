import assert from "node:assert/strict";
import { test } from "node:test";
import { checkoutCopy } from "../const";
import {
  canContinuePayment,
  payLaterOffer,
  payLaterPath,
} from "./deferred-payment";

const unpaid = {
  orderId: "ord 1",
  status: "pending_payment",
  expired: false,
  gateway: false,
  hasLiveRedirect: false,
  receiptStep: false,
};

test("pay later opens the existing order and never the cart", () => {
  const offer = payLaterOffer(unpaid);
  assert.equal(offer.offer, true);
  if (!offer.offer) return;
  assert.equal(offer.href, "/orders/ord%201");
  assert.equal(offer.href, payLaterPath("ord 1"));
  assert.equal(offer.href.includes("/cart"), false);
  assert.equal(offer.href.includes("/checkout"), false);
  assert.equal(checkoutCopy.fa.payLater, "بعداً پرداخت می‌کنم");
  assert.equal(checkoutCopy.en.payLater, "I'll pay later");
});

test("a second click still addresses the same order", () => {
  const first = payLaterOffer(unpaid);
  const second = payLaterOffer({ ...unpaid, orderId: "ord 1" });
  assert.deepEqual(first, second);
});

test("expired, cancelled, and paid orders do not offer payment continuation", () => {
  assert.deepEqual(payLaterOffer({ ...unpaid, expired: true }), {
    offer: false,
    reason: "expired",
  });
  for (const status of ["cancelled", "expired", "confirmed", "rejected"]) {
    assert.equal(payLaterOffer({ ...unpaid, status }).offer, false, status);
    assert.equal(
      canContinuePayment({
        status,
        dueAt: Date.now() + 60_000,
        now: Date.now(),
      }),
      false,
      status,
    );
  }
  const now = 1_000;
  assert.equal(
    canContinuePayment({
      status: "pending_payment",
      dueAt: now,
      now,
    }),
    false,
  );
  assert.equal(
    canContinuePayment({
      status: "pending_payment",
      dueAt: now + 1,
      now,
    }),
    true,
  );
});

test("the receipt step keeps receipt submission and hides pay later", () => {
  assert.deepEqual(payLaterOffer({ ...unpaid, receiptStep: true }), {
    offer: false,
    reason: "receipt-step",
  });
  assert.equal(
    canContinuePayment({
      status: "pending_verification",
      dueAt: Date.now() - 1,
      now: Date.now(),
    }),
    false,
  );
});

test("gateway redirect is not replaced with the manual pay-later link", () => {
  assert.equal(payLaterOffer({ ...unpaid, gateway: true }).offer, false);
  assert.equal(
    payLaterOffer({ ...unpaid, hasLiveRedirect: true, gateway: true }).offer,
    false,
  );
});
