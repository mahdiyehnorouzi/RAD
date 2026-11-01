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

export function PaymentCard({ card }: { card: ManualCardPayment }) {
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
      setCopied(null);
      setFailed(true);
    }
  }

  const model = paymentCardModel(card);

  return (
    <PaymentCardView
      styles={styles}
      card={card}
      dir={locale === "fa" ? "rtl" : "ltr"}
      copied={copied}
      failed={failed}
      labels={{
        title: c.cardTitle,
        subtitle: c.cardSubtitle,
        cardLabel: c.cardLabel,
        holderLabel: c.holderLabel,
        bankLabel: c.bankLabel,
        copyCard: c.copyCard,
        copyCardName: c.copyCardName,
        copyCardHint: c.copyCardHint,
        copyCardDone: c.copyCardDone,
        copyCardDoneName: c.copyCardDoneName,
        copyFailed: c.copyFailed,
        copyFailedDetail: c.copyFailedDetail,
        instruction: c.instruction,
      }}
      onCopyCard={() => void copy("card", model.copyDigits)}
    />
  );
}
