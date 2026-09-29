"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Clock3,
  CreditCard,
  FileText,
  Package,
  TimerOff,
  Truck,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import type { Order } from "@rad/types";
import type { PaymentReceiptInput } from "@/types/api";
import { useLocale } from "@/components/i18n";
import { Button, ButtonLink } from "@/components/ui/button-link";
import { formatToman } from "@/lib/money";
import { formatCountdown } from "@/lib/catalog/product-status";
import { useCountdown } from "@/hooks/use-countdown";
import { STORE_ORDER_STATUS_KEY, orderDetailCopy } from "../const";
import { ReceiptForm } from "./receipt-form";

function NextCard({
  id,
  icon: Icon,
  tone = "wait",
  title,
  note,
  children,
}: {
  id: string;
  icon: LucideIcon;
  tone?: "wait" | "go" | "stop";
  title: ReactNode;
  note?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section id={id} className={children ? "track-card track-next" : "track-next"}>
      <div className={`track-notice is-${tone}`} role="status">
        <Icon aria-hidden="true" />
        <div>
          <strong>{title}</strong>
          {note ? <span>{note}</span> : null}
        </div>
      </div>
      {children ? <div className="track-next-body">{children}</div> : null}
    </section>
  );
}

export function OrderNextAction({
  id,
  order,
  busy,
  onConfirmPayment,
  onCancel,
}: {
  id: string;
  order: Order;
  busy: boolean;
  onConfirmPayment: (receipt: PaymentReceiptInput) => void;
  onCancel: () => void;
}) {
  const { locale, t, number } = useLocale();
  const c = orderDetailCopy[locale];
  const Forward = locale === "fa" ? ChevronLeft : ChevronRight;
  const remaining = useCountdown(order.payment?.dueAt);
  const [copied, setCopied] = useState(false);
  const [cardCopied, setCardCopied] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const submittedAt = order.payment?.submittedAt;

  useEffect(() => {
    setReplacing(false);
  }, [submittedAt]);

  const productHref = order.slugs[0]
    ? `/products/${order.slugs[0]}`
    : "/products";
  const manualCard = order.payment?.manualCard;
  const redirectUrl = order.payment?.redirectUrl;
  const amountDue = order.payment?.amount ?? order.total;
  const amountLabel =
    locale === "fa"
      ? formatToman(amountDue)
      : `${new Intl.NumberFormat("en-US").format(amountDue)} toman`;

  const deadline =
    remaining === null
      ? undefined
      : remaining > 0
        ? t("paymentDueIn", {
            time: formatCountdown(remaining, locale, number),
          })
        : t("holdExpired");

  if (order.status === "pending_payment") {
    if (redirectUrl) {
      return (
        <NextCard id={id} icon={CreditCard} title={t("gatewayPaymentHint")} note={deadline}>
          <div className="order-next-actions">
            <Button
              type="button"
              onClick={() => {
                window.location.assign(redirectUrl);
              }}
              disabled={busy}
            >
              {t("continueToGateway")}
            </Button>
            <Button type="button" outline onClick={onCancel} disabled={busy}>
              {t("cancelDemoOrder")}
            </Button>
          </div>
        </NextCard>
      );
    }

    return (
      <NextCard id={id} icon={WalletCards} title={t("manualPaymentHint")} note={deadline}>
        {manualCard ? (
          <div className="order-pay-card">
            <span className="order-pay-card-label">
              {t("manualPaymentCardLabel")}
            </span>
            <b className="order-pay-card-number" dir="ltr">
              {manualCard.cardNumber}
            </b>
            <span className="order-pay-card-meta">
              {manualCard.cardHolder}
              {manualCard.bankName ? ` · ${manualCard.bankName}` : ""}
            </span>
            <span className="order-pay-card-amount">
              {t("manualPaymentAmount", { amount: amountLabel })}
            </span>
            <Button
              type="button"
              outline
              onClick={async () => {
                await navigator.clipboard.writeText(
                  manualCard.cardNumber.replace(/\D/g, ""),
                );
                setCardCopied(true);
                window.setTimeout(() => setCardCopied(false), 1800);
              }}
            >
              {cardCopied
                ? t("manualPaymentCardCopied")
                : t("manualPaymentCopyCard")}
            </Button>
          </div>
        ) : null}

        <ReceiptForm
          busy={busy}
          note={t("manualPaymentConfirmNote")}
          submitLabel={t("confirmManualPayment")}
          onSubmit={onConfirmPayment}
        >
          <Button type="button" outline onClick={onCancel} disabled={busy}>
            {t("cancelDemoOrder")}
          </Button>
        </ReceiptForm>
      </NextCard>
    );
  }

  if (order.status === "pending_verification") {
    const trackingNumber = order.payment?.trackingNumber;
    const receiptImage = order.payment?.receiptImage;
    return (
      <NextCard id={id} icon={Clock3} title={c.reviewTitle} note={c.reviewNote}>
        {trackingNumber ? (
          <p className="track-receipt-number">
            <FileText aria-hidden="true" />
            {t("receiptSubmittedTracking", { number: trackingNumber })}
          </p>
        ) : null}
        {receiptImage && !replacing ? (
          <figure className="track-receipt">
            <img src={receiptImage} alt={t("receiptPreviewAlt")} />
            <figcaption>{c.receiptTitle}</figcaption>
          </figure>
        ) : null}
        {replacing ? (
          <ReceiptForm
            busy={busy}
            note={t("receiptReplaceHint")}
            submitLabel={t("receiptReplaceSubmit")}
            onSubmit={onConfirmPayment}
          >
            <Button
              type="button"
              outline
              onClick={() => setReplacing(false)}
              disabled={busy}
            >
              {t("receiptReplaceCancel")}
            </Button>
          </ReceiptForm>
        ) : (
          <button
            type="button"
            className="track-quiet-link"
            onClick={() => setReplacing(true)}
            disabled={busy}
          >
            {t("receiptReplaceToggle")}
            <Forward aria-hidden="true" />
          </button>
        )}
      </NextCard>
    );
  }

  if (order.status === "rejected") {
    return (
      <NextCard
        id={id}
        icon={CircleAlert}
        tone="stop"
        title={t("paymentRejectedTitle")}
        note={
          order.payment?.rejectionReason
            ? t("paymentRejectedReason", {
                reason: order.payment.rejectionReason,
              })
            : undefined
        }
      >
        <p className="order-pay-note">{t("paymentRejectedHelp")}</p>
        <div className="order-next-actions">
          <ButtonLink href={productHref} outline>
            {t("nextActionBrowse")}
          </ButtonLink>
        </div>
      </NextCard>
    );
  }

  if (order.status === "expired") {
    return (
      <NextCard id={id} icon={TimerOff} tone="stop" title={t("orderExpiredNote")}>
        <div className="order-next-actions">
          <ButtonLink href={productHref} outline>
            {t("nextActionBrowse")}
          </ButtonLink>
        </div>
      </NextCard>
    );
  }

  if (order.status === "confirmed") {
    return <NextCard id={id} icon={CircleCheck} tone="go" title={t("waitingPacking")} />;
  }

  if (order.status === "packing") {
    return <NextCard id={id} icon={Package} tone="go" title={t("waitingShip")} />;
  }

  if (order.status === "shipped") {
    return (
      <NextCard id={id} icon={Truck} tone="go" title={t("waitingDelivery")}>
        {order.trackingCode ? (
          <div className="order-next-actions">
            <Button
              type="button"
              outline
              onClick={async () => {
                await navigator.clipboard.writeText(order.trackingCode ?? "");
                setCopied(true);
              }}
            >
              {copied ? t("trackingCopied") : t("copyTracking")}
            </Button>
          </div>
        ) : null}
      </NextCard>
    );
  }

  if (order.status === "delivered") {
    return (
      <NextCard id={id} icon={CircleCheck} tone="go" title={t("orderComplete")}>
        <div className="order-next-actions">
          <ButtonLink href={productHref} outline>
            {t("leaveReview")}
          </ButtonLink>
        </div>
      </NextCard>
    );
  }

  return (
    <NextCard
      id={id}
      icon={CircleAlert}
      tone="stop"
      title={t(STORE_ORDER_STATUS_KEY[order.status])}
    >
      <div className="order-next-actions">
        <ButtonLink href="/products" outline>
          {t("nextActionBrowse")}
        </ButtonLink>
      </div>
    </NextCard>
  );
}
