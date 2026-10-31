import { useId } from "react";
import { Check, CircleAlert, Copy, Info } from "lucide-react";
import type { ManualCardPayment } from "@rad/types";
import {
  cardDigitsForCopy,
  cardNumberGroups,
  holderNameLines,
} from "../../../lib/payment/receipt";

export type PaymentCardCopyKey = "card";

export type PaymentCardLabels = {
  title: string;
  subtitle: string;
  cardLabel: string;
  holderLabel: string;
  bankLabel: string;
  copyCard: string;
  copyCardName: string;
  copyCardHint: string;
  copyCardDone: string;
  copyCardDoneName: string;
  copyFailed: string;
  copyFailedDetail: string;
  instruction: string;
};

export function paymentCardModel(card: ManualCardPayment) {
  const groups = cardNumberGroups(card.cardNumber);
  return {
    groups,
    copyDigits: cardDigitsForCopy(card.cardNumber),
    holderLines: holderNameLines(card.cardHolder),
    holder: card.cardHolder.trim(),
    bankName: card.bankName?.trim() || "",
  };
}

export function PaymentCardView({
  styles,
  card,
  labels,
  copied,
  failed,
  dir,
  onCopyCard,
}: {
  styles: Record<string, string>;
  card: ManualCardPayment;
  labels: PaymentCardLabels;
  copied: PaymentCardCopyKey | null;
  failed: boolean;
  dir: "rtl" | "ltr";
  onCopyCard: () => void;
}) {
  const titleId = useId();
  const hintId = useId();
  const liveId = useId();
  const model = paymentCardModel(card);
  const state = failed ? "error" : copied === "card" ? "copied" : "idle";
  const Icon =
    state === "error" ? CircleAlert : state === "copied" ? Check : Copy;
  const visibleLabel =
    state === "error"
      ? labels.copyFailed
      : state === "copied"
        ? labels.copyCardDone
        : labels.copyCard;
  const accessibleName =
    state === "error"
      ? labels.copyFailed
      : state === "copied"
        ? labels.copyCardDoneName
        : labels.copyCardName;

  return (
    <div className={styles.frame}>
      <article
        className={styles.card}
        dir={dir}
        lang={dir === "rtl" ? "fa" : "en"}
        aria-labelledby={titleId}
      >
        <img
          className={styles.art}
          src="/studio/bowl.webp"
          alt=""
          width={128}
          height={128}
          decoding="async"
        />
        <div className={styles.titles}>
          <h2 id={titleId}>{labels.title}</h2>
          <p className={styles.subtitle}>{labels.subtitle}</p>
        </div>
        <p className={styles.mark} lang="fa">
          رَد
        </p>

        <div className={styles.numberBlock}>
          <span className={styles.kicker}>{labels.cardLabel}</span>
          <div className={styles.numberRow}>
            <button
              className={styles.copy}
              type="button"
              data-state={state}
              aria-label={accessibleName}
              aria-describedby={`${hintId} ${liveId}`}
              onClick={onCopyCard}
            >
              <Icon aria-hidden="true" />
              {visibleLabel}
            </button>
            <p className={styles.number} dir="ltr" lang="en">
              {model.groups.join(" ")}
            </p>
          </div>
        </div>

        <div className={styles.meta}>
          {model.holder ? (
            <div className={styles.metaItem}>
              <span className={styles.kicker}>{labels.holderLabel}</span>
              <strong className={styles.value} dir="auto">
                {model.holder}
              </strong>
            </div>
          ) : null}
          {model.bankName ? (
            <div className={styles.metaItem}>
              <span className={styles.kicker}>{labels.bankLabel}</span>
              <strong className={styles.value} dir="auto">
                {model.bankName}
              </strong>
            </div>
          ) : null}
        </div>

        <p className={styles.note}>
          <Info aria-hidden="true" />
          <span>{labels.instruction}</span>
        </p>
      </article>
      <p id={hintId} className={styles.live}>
        {labels.copyCardHint}
      </p>
      <p id={liveId} className={styles.live} role={failed ? "alert" : "status"}>
        {failed
          ? labels.copyFailedDetail
          : copied === "card"
            ? labels.copyCardDoneName
            : ""}
      </p>
    </div>
  );
}
