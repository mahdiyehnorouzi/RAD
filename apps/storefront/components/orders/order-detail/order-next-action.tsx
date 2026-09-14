"use client";

import { useRef, useState, type ChangeEvent } from "react";
import type { Order } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { Button, ButtonLink } from "@/components/ui/button-link";
import { formatTotal } from "@/lib/money";

export function OrderNextAction({
  order,
  busy,
  onConfirmPayment,
  onCancel,
}: {
  order: Order;
  busy: boolean;
  onConfirmPayment: (receiptImage: string) => void;
  onCancel: () => void;
}) {
  const { locale, t } = useLocale();
  const fileRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [cardCopied, setCardCopied] = useState(false);
  const [receiptImage, setReceiptImage] = useState("");
  const [fileName, setFileName] = useState("");
  const [receiptError, setReceiptError] = useState("");
  const productHref = order.slugs[0] ? `/products/${order.slugs[0]}` : "/products";
  const manualCard = order.payment?.manualCard;
  const redirectUrl = order.payment?.redirectUrl;
  const receiptSubmitted = order.payment?.status === "submitted";

  const onReceiptChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (
      ![/^image\/jpeg$/, /^image\/png$/, /^image\/webp$/].some((type) =>
        type.test(file.type),
      ) ||
      file.size > 1024 * 1024 ||
      file.size === 0
    ) {
      setReceiptError(t("receiptImageError"));
      setReceiptImage("");
      setFileName("");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setReceiptImage(String(reader.result));
      setFileName(file.name);
      setReceiptError("");
    };
    reader.onerror = () => {
      setReceiptError(t("receiptImageError"));
      setReceiptImage("");
      setFileName("");
    };
    reader.readAsDataURL(file);
  };

  if (order.status === "payment_pending") {
    if (redirectUrl) {
      return (
        <div className="order-next">
          <p>{t("gatewayPaymentHint")}</p>
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

    if (receiptSubmitted) {
      return (
        <div className="order-next">
          <p>{t("receiptAwaitingReview")}</p>
          {order.payment?.receiptImage ? (
            <figure className="order-receipt-preview">
              <img
                src={order.payment.receiptImage}
                alt={t("receiptPreviewAlt")}
              />
            </figure>
          ) : null}
          <div className="order-next-actions">
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
        {manualCard ? (
          <div className="order-pay-card">
            <span className="order-pay-card-label">{t("manualPaymentCardLabel")}</span>
            <b className="order-pay-card-number" dir="ltr">
              {manualCard.cardNumber}
            </b>
            <span className="order-pay-card-meta">
              {manualCard.cardHolder}
              {manualCard.bankName ? ` · ${manualCard.bankName}` : ""}
            </span>
            <span className="order-pay-card-amount">
              {t("manualPaymentAmount", {
                amount: formatTotal(
                  locale === "fa" ? order.total : order.usdTotal ?? order.total,
                  locale,
                ),
              })}
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
              {cardCopied ? t("manualPaymentCardCopied") : t("manualPaymentCopyCard")}
            </Button>
          </div>
        ) : null}

        <div className="order-receipt-upload">
          <p className="order-pay-note">{t("manualPaymentConfirmNote")}</p>
          <label className="order-receipt-label" htmlFor="order-receipt-input">
            {t("receiptUploadLabel")}
          </label>
          <input
            ref={fileRef}
            id="order-receipt-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onReceiptChange}
            disabled={busy}
          />
          {fileName ? <small>{fileName}</small> : null}
          {receiptImage ? (
            <figure className="order-receipt-preview">
              <img src={receiptImage} alt={t("receiptPreviewAlt")} />
            </figure>
          ) : null}
          {receiptError ? (
            <p className="form-error" role="alert">
              {receiptError}
            </p>
          ) : null}
        </div>

        <div className="order-next-actions">
          <Button
            type="button"
            onClick={() => {
              if (!receiptImage) {
                setReceiptError(t("receiptRequired"));
                fileRef.current?.focus();
                return;
              }
              onConfirmPayment(receiptImage);
            }}
            disabled={busy}
          >
            {t("confirmManualPayment")}
          </Button>
          <Button type="button" outline onClick={onCancel} disabled={busy}>
            {t("cancelDemoOrder")}
          </Button>
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
