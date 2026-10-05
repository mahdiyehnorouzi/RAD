"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Copy, Landmark } from "lucide-react";
import type { ManualCardPayment } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { cardNumberGroups } from "@/lib/payment/receipt";
import { checkoutCopy } from "../const";
export function PaymentCard({
  card,
  amount,
  amountDigits,
}: {
  card: ManualCardPayment;
  amount: string;
  amountDigits: string;
}) {
  const { locale } = useLocale();
  const c = checkoutCopy[locale];
  const [copied, setCopied] = useState<"card" | "amount" | null>(null);
  const [failed, setFailed] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  async function copy(key: "card" | "amount", text: string) {
    clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setFailed(false);
      timer.current = window.setTimeout(() => setCopied(null), 2500);
    } catch {
      setFailed(true);
    }
  }
  const groups = cardNumberGroups(card.cardNumber);
  return (
    <div className="transfer-details">
      <article className="transfer-card" aria-label={c.cardLabel}>
        <div className="transfer-bank">
          <Landmark aria-hidden="true" />
          <span>{card.bankName}</span>
        </div>
        <p className="transfer-number" dir="ltr">
          {groups.join("  ")}
        </p>
        <div className="transfer-holder">
          <span>{card.cardHolder}</span>
          <Copy aria-hidden="true" />
        </div>
      </article>
      <button
        className="transfer-copy"
        type="button"
        onClick={() => void copy("card", groups.join(""))}
      >
        <Copy aria-hidden="true" />
        {c.copyCard}
      </button>
      <p className="transfer-feedback" aria-live="polite">
        {copied === "card" && (
          <>
            <Check />
            {locale === "fa" ? "شماره کارت کپی شد" : "Card number copied"}
          </>
        )}
      </p>
      <div className="transfer-amount">
        <span>
          {locale === "fa" ? "مبلغی که باید واریز کنید" : "Amount to transfer"}
        </span>
        <b>{amount}</b>
        <button
          className="transfer-copy"
          type="button"
          onClick={() => void copy("amount", amountDigits)}
        >
          {copied === "amount" ? <Check /> : <Copy />}
          {copied === "amount" ? c.copied : c.copyAmount}
        </button>
      </div>
      {failed && (
        <p className="checkout-alert" role="alert">
          {c.copyFailed}
        </p>
      )}
    </div>
  );
}
