"use client";

import { useId, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import type { PaymentReceiptInput } from "@/types/api";
import { ImageUp } from "lucide-react";
import { useLocale } from "@/components/i18n";
import { Button } from "@/components/ui/button-link";
import {
  RECEIPT_TYPES,
  isReceiptFile,
  normalizeTrackingNumber,
  readReceiptFile,
} from "@/lib/payment/receipt";

/** Receipt image + bank tracking number, for the first upload or a replacement. */
export function ReceiptForm({
  busy,
  submitLabel,
  note,
  onSubmit,
  children,
}: {
  busy: boolean;
  submitLabel: string;
  note?: string;
  onSubmit: (receipt: PaymentReceiptInput) => void;
  children?: ReactNode;
}) {
  const { t } = useLocale();
  const id = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const trackingRef = useRef<HTMLInputElement>(null);
  const [receiptImage, setReceiptImage] = useState("");
  const [fileName, setFileName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [receiptError, setReceiptError] = useState("");
  const [trackingError, setTrackingError] = useState("");

  const resetFile = (message: string) => {
    setReceiptError(message);
    setReceiptImage("");
    setFileName("");
  };

  const onReceiptChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!isReceiptFile(file)) {
      resetFile(t("receiptImageError"));
      event.target.value = "";
      return;
    }
    readReceiptFile(file)
      .then((dataUrl) => {
        setReceiptImage(dataUrl);
        setFileName(file.name);
        setReceiptError("");
      })
      .catch(() => resetFile(t("receiptImageError")));
  };

  const submit = () => {
    const tracking = normalizeTrackingNumber(trackingNumber);
    if (!receiptImage) {
      setReceiptError(t("receiptRequired"));
      fileRef.current?.focus();
      return;
    }
    if (!tracking) {
      setTrackingError(t("trackingNumberError"));
      trackingRef.current?.focus();
      return;
    }
    onSubmit({ receiptImage, trackingNumber: tracking });
  };

  return (
    <>
      <div className="order-receipt-upload">
        {note ? <p className="order-pay-note">{note}</p> : null}
        <label className="order-receipt-label" htmlFor={`${id}-file`}>
          {t("receiptUploadLabel")}
        </label>
        <input
          ref={fileRef}
          id={`${id}-file`}
          className="order-receipt-file"
          type="file"
          accept={RECEIPT_TYPES.join(",")}
          onChange={onReceiptChange}
          disabled={busy}
          aria-invalid={receiptError ? true : undefined}
          aria-describedby={receiptError ? `${id}-file-error` : undefined}
        />
        <label className="order-receipt-drop" htmlFor={`${id}-file`} aria-hidden="true">
          <ImageUp aria-hidden="true" />
          <span>{fileName || t("receiptChoose")}</span>
        </label>
        {receiptImage ? (
          <figure className="order-receipt-preview">
            <img src={receiptImage} alt={t("receiptPreviewAlt")} />
          </figure>
        ) : null}
        {receiptError ? (
          <p id={`${id}-file-error`} className="form-error" role="alert">
            {receiptError}
          </p>
        ) : null}

        <label className="order-receipt-label" htmlFor={`${id}-tracking`}>
          {t("trackingNumberLabel")}
        </label>
        <input
          ref={trackingRef}
          id={`${id}-tracking`}
          className="order-tracking-input"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          dir="ltr"
          value={trackingNumber}
          onChange={(event) => {
            setTrackingNumber(event.target.value);
            setTrackingError("");
          }}
          disabled={busy}
          aria-invalid={trackingError ? true : undefined}
          aria-describedby={`${id}-tracking-hint${trackingError ? ` ${id}-tracking-error` : ""}`}
        />
        <small id={`${id}-tracking-hint`}>{t("trackingNumberHint")}</small>
        {trackingError ? (
          <p id={`${id}-tracking-error`} className="form-error" role="alert">
            {trackingError}
          </p>
        ) : null}
      </div>

      <div className="order-next-actions">
        <Button type="button" onClick={submit} disabled={busy}>
          {submitLabel}
        </Button>
        {children}
      </div>
    </>
  );
}
