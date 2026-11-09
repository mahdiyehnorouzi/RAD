import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { faCore } from "@rad/i18n/fa";
import { enCore } from "@rad/i18n/en";
import { fa } from "../../../i18n/fa";
import { en } from "../../../i18n/en";
import { checkoutCopy } from "../../checkout/const";
import { cartCopy } from "../../../features/cart/const";
import {
  faqFallbackEn,
  faqFallbackFa,
} from "../../../lib/content/faq-fallback";
import {
  currentPolicyVersion,
  policyDocument,
  purchasePathCopy,
  ORDER_STATUS_GUIDE,
} from "./index";
import type { PolicyVersion } from "../type";

const APPROVED_FA =
  "پس از آماده‌شدن اثر، سفارش‌های تهران با پست یا پیک و سفارش‌های شهرهای دیگر با پست ارسال می‌شوند.";
const APPROVED_EN =
  "After the work is ready, Tehran orders are sent by post or courier; orders to other cities are sent by post.";

function published(version: PolicyVersion) {
  return JSON.stringify({ points: version.points, sections: version.sections });
}

test("the current shipping texts use only the approved sending method", () => {
  for (const slug of [
    "shipping",
    "buying",
    "terms",
    "custom",
    "returns",
  ] as const) {
    const doc = policyDocument(slug);
    assert.ok(doc);
    const current = currentPolicyVersion(doc);
    assert.equal(current.id, "2026-11-09");
    const text = published(current);
    assert.equal(text.includes("رایگان"), false, slug);
    assert.equal(/insured/i.test(text), false, slug);
    assert.equal(text.includes("2–4"), false, slug);
    assert.equal(text.includes("4–8"), false, slug);
    assert.equal(text.includes("۲ تا ۴"), false, slug);
    assert.equal(text.includes("۴ تا ۸"), false, slug);
    const previous = doc.versions.find(
      (version) => version.id === "2026-09-27",
    );
    assert.ok(previous, slug);
  }

  const shipping = published(currentPolicyVersion(policyDocument("shipping")!));
  assert.equal(shipping.includes(APPROVED_FA), true);
  assert.equal(shipping.includes(APPROVED_EN), true);
  assert.equal(shipping.includes("جداگانه"), false);

  assert.equal(purchasePathCopy.fa.cartFinal, APPROVED_FA);
  assert.equal(purchasePathCopy.en.cartFinal, APPROVED_EN);
  assert.equal(purchasePathCopy.fa.disclosureTeaser, APPROVED_FA);
  assert.equal(ORDER_STATUS_GUIDE.confirmed.section, "method");
  assert.equal(ORDER_STATUS_GUIDE.confirmed.body.fa, APPROVED_FA);

  assert.equal(fa.shipping, APPROVED_FA);
  assert.equal(en.shipping, APPROVED_EN);
  assert.equal(faCore.homeBanner, APPROVED_FA);
  assert.equal(enCore.homeBanner, APPROVED_EN);
  assert.equal(
    faqFallbackFa.items.find((item) => item.id === "delivery")?.answer,
    APPROVED_FA,
  );
  assert.equal(
    faqFallbackEn.items.find((item) => item.id === "delivery")?.answer,
    APPROVED_EN,
  );
  assert.equal(
    faqFallbackFa.items.some((item) => item.answer.includes("بیمه")),
    false,
  );

  const studio = readFileSync(
    new URL("../../../features/studio/const/order-policy.ts", import.meta.url),
    "utf8",
  );
  assert.equal(studio.includes("ارسال بیمه‌شده"), false);
  assert.equal(studio.includes("Insured shipping"), false);

  const cartNote = readFileSync(
    new URL("../purchase-path/cart-policy-note.tsx", import.meta.url),
    "utf8",
  );
  assert.equal(cartNote.includes("cartArrival"), false);
  assert.equal(cartNote.includes('id: "tehran"'), false);
});

test("the cart and checkout shipping rows still wait on a price decision", () => {
  assert.equal(cartCopy.fa.shipping, "هزینه ارسال پس از بررسی مشخص می‌شود");
  assert.equal(cartCopy.en.shipping, "Shipping cost confirmed after review");
  assert.equal(checkoutCopy.fa.shipping, "هزینه‌ی ارسال");
  assert.equal(checkoutCopy.fa.shippingUnset, "پس از بررسی مشخص می‌شود");
  assert.equal(checkoutCopy.en.shippingUnset, "Confirmed after review");
  const pending = [
    cartCopy.fa.shipping,
    cartCopy.en.shipping,
    checkoutCopy.fa.shippingUnset,
    checkoutCopy.en.shippingUnset,
  ].join("\n");
  assert.equal(pending.includes("رایگان"), false);
  assert.equal(/free|insured/i.test(pending), false);
});
