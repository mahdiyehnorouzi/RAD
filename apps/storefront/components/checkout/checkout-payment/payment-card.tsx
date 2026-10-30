"use client";
import { useEffect, useRef, useState } from "react";
import type { ManualCardPayment } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { checkoutCopy } from "../const";
import {
  PaymentCardView,
  paymentCardModel,
  type PaymentCardCopyKey,
} from "./payment-card-view";
import styles from "./payment-card.module.css";

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
  const [copied, setCopied] = useState<PaymentCardCopyKey | null>(null);
  const [failed, setFailed] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy(key: PaymentCardCopyKey, text: string) {
    window.clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setFailed(false);
      timer.current = window.setTimeout(() => setCopied(null), 2500);
    } catch {
      setFailed(true);
    }
  }

  const model = paymentCardModel(card);

  return (
    <PaymentCardView
      styles={styles}
      card={card}
      amount={amount}
      copied={copied}
      failed={failed}
      labels={{
        cardLabel: c.cardLabel,
        copyCard: c.copyCard,
        copyCardHint: c.copyCardHint,
        copyCardDone: c.copyCardDone,
        amountDueLabel: c.amountDueLabel,
        copyAmount: c.copyAmount,
        copied: c.copied,
        copyFailed: c.copyFailed,
      }}
      onCopyCard={() => void copy("card", model.copyDigits)}
      onCopyAmount={() => void copy("amount", amountDigits)}
    />
  );
}
