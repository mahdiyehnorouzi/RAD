import assert from "node:assert/strict";
import { test } from "node:test";
import { faqSection } from "../content/faq.data";
import { defaultHelpQuestions } from "./help-questions.data";

const APPROVED_FA =
  "پس از آماده‌شدن اثر، سفارش‌های تهران با پست یا پیک و سفارش‌های شهرهای دیگر با پست ارسال می‌شوند.";
const APPROVED_EN =
  "After the work is ready, Tehran orders are sent by post or courier; orders to other cities are sent by post.";

test("customer help answers do not claim free or insured shipping", () => {
  const help = defaultHelpQuestions.map((item) => ({
    fa: item.answer.fa,
    en: item.answer.en,
  }));
  const faq = faqSection.items.map((item) => item.answer);
  const text = JSON.stringify({ help, faq });
  assert.equal(text.includes("رایگان"), false);
  assert.equal(/insured/i.test(text), false);
  assert.equal(text.includes("2–4"), false);
  assert.equal(text.includes("۴ تا ۸"), false);
  const shipping = defaultHelpQuestions.find((item) => item.id === "shipping");
  assert.equal(shipping?.answer.fa, APPROVED_FA);
  assert.equal(shipping?.answer.en, APPROVED_EN);
  assert.equal(shipping?.more?.section, "method");
  const delivery = faqSection.items.find((item) => item.id === "delivery");
  assert.equal(delivery?.answer.fa, APPROVED_FA);
  assert.equal(delivery?.answer.en, APPROVED_EN);
});
