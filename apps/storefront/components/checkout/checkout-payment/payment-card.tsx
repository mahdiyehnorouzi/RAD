"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Copy, CopyCheck } from "lucide-react";
import type { ManualCardPayment } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { WatercolorWash } from "@/components/ui/watercolor-wash";
import { cardNumberGroups, toLocaleDigits } from "@/lib/payment/receipt";
import { checkoutCopy } from "../const";

type CopyKey = "all" | "card" | "holder" | "amount";

export function PaymentCard({
  card,
  amount,
  amountDigits,
}: {
  card: ManualCardPayment;
  /** Formatted for display, with the currency unit. */
  amount: string;
  /** Plain digits for the clipboard. */
  amountDigits: string;
}) {
  const { locale } = useLocale();
  const c = checkoutCopy[locale];
  const [copied, setCopied] = useState<CopyKey | null>(null);
  const [failed, setFailed] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const groups = cardNumberGroups(card.cardNumber);
  const digits = groups.join("");

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async (key: CopyKey, text: string) => {
    window.clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(text);
      setFailed(false);
      setCopied(key);
      timer.current = window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setFailed(true);
    }
  };

  const copyButton = (key: CopyKey, label: string, text: string) => (
    <button
      type="button"
      className={`payment-copy${copied === key ? " is-copied" : ""}`}
      onClick={() => void copy(key, text)}
      aria-label={label}
      title={label}
    >
      {copied === key ? (
        <Check aria-hidden="true" />
      ) : (
        <Copy aria-hidden="true" />
      )}
    </button>
  );

  return (
    <>
      <div className="payment-amount">
        <span>{c.amountLabel}</span>
        <b>{amount}</b>
        {copyButton("amount", c.copyAmount, amountDigits)}
      </div>

      <article className="payment-card" aria-label={c.cardLabel}>
        <WatercolorWash shape="edge" className="payment-card-wash" />

        <header className="payment-card-head">
          {card.bankName ? <b className="payment-card-bank">{card.bankName}</b> : <span />}
          <button
            type="button"
            className={`payment-copy-all${copied === "all" ? " is-copied" : ""}`}
            onClick={() =>
              void copy(
                "all",
                [digits, card.cardHolder, card.bankName, amountDigits]
                  .filter(Boolean)
                  .join("\n"),
              )
            }
          >
            {copied === "all" ? <CopyCheck aria-hidden="true" /> : <Copy aria-hidden="true" />}
            <span>{copied === "all" ? c.copied : c.copyAll}</span>
          </button>
        </header>

        <div className="payment-card-row">
          <div>
            <span className="payment-card-label">{c.cardLabel}</span>
            <p className="payment-card-number" dir="ltr">
              {groups.map((group, index) => (
                <span key={index}>{toLocaleDigits(group, locale)}</span>
              ))}
            </p>
          </div>
          {copyButton("card", c.copyCard, digits)}
        </div>

        <div className="payment-card-row">
          <div>
            <span className="payment-card-label">{c.holderLabel}</span>
            <p className="payment-card-holder">{card.cardHolder}</p>
          </div>
          {copyButton("holder", c.copyHolder, card.cardHolder)}
        </div>
      </article>

      <span className="checkout-sr" aria-live="polite">
        {copied ? c.copied : ""}
      </span>
      {failed ? (
        <p className="checkout-alert" role="alert">
          {c.copyFailed}
        </p>
      ) : null}
    </>
  );
}
