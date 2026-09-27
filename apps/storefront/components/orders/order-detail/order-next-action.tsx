"use client";

import { useEffect, useState } from "react";
import type { Order } from "@rad/types";
import type { PaymentReceiptInput } from "@/types/api";
import { useLocale } from "@/components/i18n";
import { Button, ButtonLink } from "@/components/ui/button-link";
import { formatToman } from "@/lib/money";
import { formatCountdown } from "@/lib/catalog/product-status";
import { useCountdown } from "@/hooks/use-countdown";
import { ReceiptForm } from "./receipt-form";

export function OrderNextAction({
  order,
  busy,
  onConfirmPayment,
  onCancel,
}: {
  order: Order;
  busy: boolean;
  onConfirmPayment: (receipt: PaymentReceiptInput) => void;
  onCancel: () => void;
}) {
  const { locale, t, number } = useLocale();
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
    remaining === null ? null : (
      <p className="order-pay-note" role="status" aria-live="off">
        {remaining > 0
          ? t("paymentDueIn", {
              time: formatCountdown(remaining, locale, number),
            })
          : t("holdExpired")}
      </p>
    );

  if (order.status === "pending_payment") {
    if (redirectUrl) {
      return (
        <div className="order-next">
          <p>{t("gatewayPaymentHint")}</p>
          {deadline}
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
        </div>
      );
    }

    return (
      <div className="order-next">
        <p>{t("manualPaymentHint")}</p>
        {deadline}
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
      </div>
    );
  }

  if (order.status === "pending_verification") {
    return (
      <div className="order-next">
        <p role="status">{t("receiptAwaitingReview")}</p>
        {order.payment?.trackingNumber ? (
          <p className="order-pay-note">
            {t("receiptSubmittedTracking", {
              number: order.payment.trackingNumber,
            })}
          </p>
        ) : null}
        {order.payment?.receiptImage && !replacing ? (
          <figure className="order-receipt-preview">
            <img
              src={order.payment.receiptImage}
              alt={t("receiptPreviewAlt")}
            />
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
          <div className="order-next-actions">
            <Button
              type="button"
              outline
              onClick={() => setReplacing(true)}
              disabled={busy}
            >
              {t("receiptReplaceToggle")}
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (order.status === "rejected") {
    return (
      <div className="order-next order-next-rejected" role="status">
        <p>
          <b>{t("paymentRejectedTitle")}</b>
        </p>
        {order.payment?.rejectionReason ? (
          <p className="order-rejection-reason">
            {t("paymentRejectedReason", {
              reason: order.payment.rejectionReason,
            })}
          </p>
        ) : null}
        <p className="order-pay-note">{t("paymentRejectedHelp")}</p>
        <div className="order-next-actions">
          <ButtonLink href={productHref} outline>
            {t("nextActionBrowse")}
          </ButtonLink>
        </div>
      </div>
    );
  }

  if (order.status === "expired") {
    return (
      <div className="order-next">
        <p>{t("orderExpiredNote")}</p>
        <div className="order-next-actions">
          <ButtonLink href={productHref} outline>
            {t("nextActionBrowse")}
          </ButtonLink>
        </div>
      </div>
    );
  }

  if (order.status === "confirmed") {
    return <p className="order-next">{t("waitingPacking")}</p>;
  }

  if (order.status === "packing") {
    return <p className="order-next">{t("waitingShip")}</p>;
  }

  if (order.status === "shipped") {
    return (
      <div className="order-next">
        <p>{t("waitingDelivery")}</p>
        {order.trackingCode ? (
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
        ) : null}
      </div>
    );
  }

  if (order.status === "delivered") {
    return (
      <div className="order-next">
        <p>{t("orderComplete")}</p>
        <ButtonLink href={productHref} outline>
          {t("leaveReview")}
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="order-next">
      <ButtonLink href="/products" outline>
        {t("nextActionBrowse")}
      </ButtonLink>
    </div>
  );
}
