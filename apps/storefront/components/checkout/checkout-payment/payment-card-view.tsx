import { Check, Copy } from "lucide-react";
import type { ManualCardPayment } from "@rad/types";
import {
  cardDigitsForCopy,
  cardNumberGroups,
  holderNameLines,
} from "../../../lib/payment/receipt";

export type PaymentCardCopyKey = "card" | "amount";

export type PaymentCardLabels = {
  cardLabel: string;
  copyCard: string;
  copyCardHint: string;
  copyCardDone: string;
  amountDueLabel: string;
  copyAmount: string;
  copied: string;
  copyFailed: string;
};

export function paymentCardModel(card: ManualCardPayment) {
  const groups = cardNumberGroups(card.cardNumber);
  return {
    groups,
    copyDigits: cardDigitsForCopy(card.cardNumber),
    holderLines: holderNameLines(card.cardHolder),
    bankName: card.bankName?.trim() || "",
  };
}

export function PaymentCardView({
  styles,
  card,
  amount,
  labels,
  copied,
  failed,
  onCopyCard,
  onCopyAmount,
}: {
  styles: Record<string, string>;
  card: ManualCardPayment;
  amount: string;
  labels: PaymentCardLabels;
  copied: PaymentCardCopyKey | null;
  failed: boolean;
  onCopyCard: () => void;
  onCopyAmount: () => void;
}) {
  const model = paymentCardModel(card);
  return (
    <div className={styles.details}>
      <article className={styles.card} aria-label={labels.cardLabel}>
        <div className={styles.stripes} aria-hidden="true" />
        <div className={styles.holder}>
          {model.holderLines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
        <p className={styles.number} dir="ltr" lang="en">
          {model.groups.map((group) => (
            <span key={group}>{group}</span>
          ))}
        </p>
        {model.bankName ? (
          <div className={styles.bank} dir="ltr">
            <span>{model.bankName}</span>
            <span className={styles.mark} aria-hidden="true" />
          </div>
        ) : null}
      </article>
      <button
        className={styles.copy}
        type="button"
        data-copied={copied === "card" || undefined}
        aria-live="polite"
        onClick={onCopyCard}
      >
        {copied === "card" ? (
          <Check aria-hidden="true" />
        ) : (
          <Copy aria-hidden="true" />
        )}
        {copied === "card" ? labels.copyCardDone : labels.copyCard}
      </button>
      <p className={styles.hint}>{labels.copyCardHint}</p>
      <div className={styles.amount} aria-label={labels.amountDueLabel}>
        <span>{labels.amountDueLabel}</span>
        <b>{amount}</b>
        <button
          className={styles.amountCopy}
          type="button"
          onClick={onCopyAmount}
        >
          {copied === "amount" ? (
            <Check aria-hidden="true" />
          ) : (
            <Copy aria-hidden="true" />
          )}
          {copied === "amount" ? labels.copied : labels.copyAmount}
        </button>
      </div>
      {failed ? (
        <p className={styles.alert} role="alert">
          {labels.copyFailed}
        </p>
      ) : null}
    </div>
  );
}
