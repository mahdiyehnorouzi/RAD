import assert from "node:assert/strict";
import { test } from "node:test";
import { checkoutCopy } from "../const";
import {
  canContinuePayment,
  payLaterOffer,
  payLaterPath,
  paymentWindowClosed,
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

test("pay later disappears on the tick the open-session countdown reaches zero", () => {
  const dueAt = 1_700_000_000_000 + 30 * 60 * 1000;
  const offerAt = (now: number) =>
    payLaterOffer({
      ...unpaid,
      expired: Math.max(0, dueAt - now) <= 0,
    });
  assert.equal(offerAt(dueAt - 1000).offer, true);
  assert.deepEqual(offerAt(dueAt), { offer: false, reason: "expired" });
  assert.equal(offerAt(dueAt + 1000).offer, false);
});

test("ordinary continuation closes on the tick the deadline passes and stays closed", () => {
  const dueAt = 1_700_000_000_000 + 30 * 60 * 1000;
  const closedAt = (now: number) =>
    paymentWindowClosed({
      orderStatus: "pending_payment",
      paymentStatus: "created",
      remainingMs: Math.max(0, dueAt - now),
    });
  assert.equal(closedAt(dueAt - 1000), false);
  assert.equal(closedAt(dueAt), true);
  assert.equal(closedAt(dueAt + 1000), true);
});

test("dueAt is compared as epoch milliseconds, the same unit as Date.now()", () => {
  const now = 1_700_000_000_000;
  assert.equal(
    canContinuePayment({
      status: "pending_payment",
      dueAt: now + 1,
      now,
    }),
    true,
  );
  assert.equal(
    canContinuePayment({
      status: "pending_payment",
      dueAt: Math.floor(now / 1000),
      now,
    }),
    false,
  );
});

test("unresolved gateway states stay on their own screen after the deadline", () => {
  for (const paymentStatus of [
    "redirected",
    "submitted",
    "verified",
    "verify_error",
    "verify_conflict",
  ]) {
    assert.equal(
      paymentWindowClosed({
        orderStatus: "pending_payment",
        paymentStatus,
        remainingMs: 0,
      }),
      false,
      paymentStatus,
    );
  }
  assert.equal(
    paymentWindowClosed({
      orderStatus: "expired",
      paymentStatus: "verify_conflict",
      remainingMs: 0,
    }),
    true,
  );
  assert.equal(
    paymentWindowClosed({
      orderStatus: "pending_verification",
      paymentStatus: "submitted",
      remainingMs: 0,
    }),
    false,
  );
});
