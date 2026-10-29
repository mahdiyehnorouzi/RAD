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

const styles = {
  details: "details",
  card: "card",
  holder: "holder",
  number: "number",
  bank: "bank",
  mark: "mark",
  copy: "copy",
  hint: "hint",
  amount: "amount",
  amountCopy: "amountCopy",
  alert: "alert",
};

const labels: PaymentCardLabels = {
  cardLabel: checkoutCopy.fa.cardLabel,
  copyCard: checkoutCopy.fa.copyCard,
  copyCardHint: checkoutCopy.fa.copyCardHint,
  copyCardDone: checkoutCopy.fa.copyCardDone,
  amountDueLabel: checkoutCopy.fa.amountDueLabel,
  copyAmount: checkoutCopy.fa.copyAmount,
  copied: checkoutCopy.fa.copied,
  copyFailed: checkoutCopy.fa.copyFailed,
};

const card = {
  cardNumber: "6037-9981-5566-7788",
  cardHolder: "مهدیه نوروزی",
  bankName: "Saman Bank",
};

function render(copied: "card" | "amount" | null = null) {
  return renderToStaticMarkup(
    createElement(PaymentCardView, {
      styles,
      card,
      amount: "۱۲٬۵۰۰٬۰۰۰ تومان",
      labels,
      copied,
      failed: false,
      onCopyCard() {},
      onCopyAmount() {},
    }),
  );
}

test("paymentCardModel exposes grouped digits, a spaceless copy payload, and the real holder", () => {
  const model = paymentCardModel(card);
  assert.deepEqual(model.groups, ["6037", "9981", "5566", "7788"]);
  assert.equal(model.copyDigits, "6037998155667788");
  assert.equal(model.copyDigits.includes(" "), false);
  assert.deepEqual(model.holderLines, ["مهدیه", "نوروزی"]);
  assert.equal(model.bankName, "Saman Bank");
  assert.notEqual(model.holderLines.join(" "), "استودیو رَد");
});

test("PaymentCardView renders the stacked LTR number, holder, bank, and a separate amount", () => {
  const html = render();
  assert.match(html, /dir="ltr"/);
  assert.match(html, /6037/);
  assert.match(html, /9981/);
  assert.match(html, /5566/);
  assert.match(html, /7788/);
  assert.match(html, /مهدیه/);
  assert.match(html, /نوروزی/);
  assert.match(html, /Saman Bank/);
  assert.match(html, /کپی شماره کارت/);
  assert.match(html, /شماره کارت بدون فاصله کپی می‌شود/);
  assert.match(html, /مبلغی که باید واریز کنید/);
  assert.match(html, /۱۲٬۵۰۰٬۰۰۰ تومان/);
  const article = html.slice(
    html.indexOf("<article"),
    html.indexOf("</article>"),
  );
  assert.equal(article.includes("۱۲٬۵۰۰٬۰۰۰"), false);
  assert.equal(html.includes("پرداخت تأیید"), false);
  assert.equal(html.includes("stripes"), false);
});

test("PaymentCardView copy success feedback does not claim the order is paid", () => {
  const html = render("card");
  assert.match(html, /شماره کارت کپی شد/);
  assert.equal(html.includes("paid"), false);
  assert.equal(html.includes("verified"), false);
});
