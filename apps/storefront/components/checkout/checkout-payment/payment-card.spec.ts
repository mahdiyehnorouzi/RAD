import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { checkoutCopy } from "../const";
import {
  PaymentCardView,
  paymentCardModel,
  type PaymentCardLabels,
} from "./payment-card-view";

const styles: Record<string, string> = {};

const labels: PaymentCardLabels = {
  title: checkoutCopy.fa.cardTitle,
  subtitle: checkoutCopy.fa.cardSubtitle,
  cardLabel: checkoutCopy.fa.cardLabel,
  holderLabel: checkoutCopy.fa.holderLabel,
  bankLabel: checkoutCopy.fa.bankLabel,
  copyCard: checkoutCopy.fa.copyCard,
  copyCardName: checkoutCopy.fa.copyCardName,
  copyCardHint: checkoutCopy.fa.copyCardHint,
  copyCardDone: checkoutCopy.fa.copyCardDone,
  copyCardDoneName: checkoutCopy.fa.copyCardDoneName,
  copyFailed: checkoutCopy.fa.copyFailed,
  copyFailedDetail: checkoutCopy.fa.copyFailedDetail,
  instruction: checkoutCopy.fa.instruction,
};

const card = {
  cardNumber: "6037-9981-5566-7788",
  cardHolder: "مهدیه نوروزی",
  bankName: "Saman Bank",
};

function render({
  copied = null,
  failed = false,
  bankName = card.bankName,
  dir = "rtl" as "rtl" | "ltr",
  copy = labels,
}: {
  copied?: "card" | null;
  failed?: boolean;
  bankName?: string;
  dir?: "rtl" | "ltr";
  copy?: PaymentCardLabels;
} = {}) {
  return renderToStaticMarkup(
    createElement(PaymentCardView, {
      styles,
      card: { ...card, bankName },
      labels: copy,
      copied,
      failed,
      dir,
      onCopyCard() {},
    }),
  );
}

test("paymentCardModel exposes grouped digits, a spaceless copy payload, and the real holder", () => {
  const model = paymentCardModel(card);
  assert.deepEqual(model.groups, ["6037", "9981", "5566", "7788"]);
  assert.equal(model.copyDigits, "6037998155667788");
  assert.equal(model.copyDigits.includes(" "), false);
  assert.deepEqual(model.holderLines, ["مهدیه", "نوروزی"]);
  assert.equal(model.holder, "مهدیه نوروزی");
  assert.equal(model.bankName, "Saman Bank");
  assert.notEqual(model.holderLines.join(" "), "استودیو رَد");
});

test("PaymentCardView renders the destination card in RTL with an LTR number", () => {
  const html = render();
  assert.match(html, /dir="rtl"/);
  assert.match(html, /lang="fa"/);
  assert.match(html, /کارت مقصد پرداخت/);
  assert.match(html, /انتقال کارت‌به‌کارت/);
  assert.match(html, /شماره کارت/);
  assert.match(html, />6037 9981 5566 7788</);
  assert.match(html, /dir="ltr"/);
  assert.match(html, /مهدیه نوروزی/);
  assert.match(html, /Saman Bank/);
  assert.match(html, /به نام/);
  assert.match(html, /بانک/);
  assert.match(html, /کپی شماره کارت/);
  assert.match(html, />کپی</);
  assert.match(html, /شماره کارت بدون فاصله کپی می‌شود/);
  assert.match(
    html,
    /مبلغ سفارش رو به این کارت انتقال بده و بعد رسید پرداختت رو ثبت کن\./,
  );
  assert.equal(html.includes("ملت"), false);
  assert.equal(html.includes("Mellat"), false);
  assert.equal(html.includes("۱۲٬۵۰۰٬۰۰۰"), false);
  const numberAt = html.indexOf(">6037 9981 5566 7788<");
  const reversed = html.indexOf("7788 5566 9981 6037");
  assert.equal(numberAt > -1, true);
  assert.equal(reversed, -1);
});

test("PaymentCardView copy success does not claim the order is paid", () => {
  const html = render({ copied: "card" });
  assert.match(html, />کپی شد</);
  assert.match(html, /شماره کارت کپی شد/);
  assert.equal(html.includes("paid"), false);
  assert.equal(html.includes("verified"), false);
  assert.equal(html.includes("پرداخت تأیید"), false);
});

test("PaymentCardView copy failure stays on the button and does not claim success", () => {
  const html = render({ failed: true });
  assert.match(html, />خطا در کپی</);
  assert.match(html, /شماره را خودتان انتخاب و کپی کنید/);
  assert.equal(html.includes(">کپی شد<"), false);
  assert.match(html, /role="alert"/);
});

test("PaymentCardView omits the bank when none is configured", () => {
  const html = render({ bankName: "" });
  assert.equal(html.includes("Saman Bank"), false);
  assert.equal(html.includes(">بانک<"), false);
  assert.match(html, /مهدیه نوروزی/);
});

test("PaymentCardView English copy reads left to right", () => {
  const html = render({ dir: "ltr", copy: {
    title: checkoutCopy.en.cardTitle,
    subtitle: checkoutCopy.en.cardSubtitle,
    cardLabel: checkoutCopy.en.cardLabel,
    holderLabel: checkoutCopy.en.holderLabel,
    bankLabel: checkoutCopy.en.bankLabel,
    copyCard: checkoutCopy.en.copyCard,
    copyCardName: checkoutCopy.en.copyCardName,
    copyCardHint: checkoutCopy.en.copyCardHint,
    copyCardDone: checkoutCopy.en.copyCardDone,
    copyCardDoneName: checkoutCopy.en.copyCardDoneName,
    copyFailed: checkoutCopy.en.copyFailed,
    copyFailedDetail: checkoutCopy.en.copyFailedDetail,
    instruction: checkoutCopy.en.instruction,
  } });
  assert.match(html, /dir="ltr"/);
  assert.match(html, /Payment card/);
  assert.match(html, /Card-to-card transfer/);
  assert.match(html, />Copy</);
  assert.equal(html.includes("کارت مقصد"), false);
});
