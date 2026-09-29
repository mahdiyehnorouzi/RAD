"use client";
import { useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { ImageUp, RefreshCw } from "lucide-react";
import type { PaymentReceiptInput } from "@/types/api";
import { useLocale } from "@/components/i18n";
import {
  RECEIPT_TYPES,
  isReceiptFile,
  normalizeTrackingNumber,
  readReceiptFile,
} from "@/lib/payment/receipt";
import { checkoutCopy } from "../const";

export function PaymentReceipt({
  id,
  busy,
  onSubmit,
}: {
  /** The form id the submit button points at. */
  id: string;
  busy: boolean;
  onSubmit: (receipt: PaymentReceiptInput) => void;
}) {
  const { locale } = useLocale();
  const c = checkoutCopy[locale];
  const uid = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const trackingRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState("");
  const [fileName, setFileName] = useState("");
  const [dragging, setDragging] = useState(false);
  const [imageError, setImageError] = useState("");
  const [tracking, setTracking] = useState("");
  const [trackingError, setTrackingError] = useState("");

  const take = (file: File | undefined) => {
    if (!file) return;
    if (!isReceiptFile(file)) {
      setImageError(c.receiptError);
      return;
    }
    readReceiptFile(file)
      .then((dataUrl) => {
        setImage(dataUrl);
        setFileName(file.name);
        setImageError("");
      })
      .catch(() => setImageError(c.receiptError));
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    take(event.target.files?.[0]);
    event.target.value = "";
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    if (!busy) take(event.dataTransfer.files?.[0]);
  };

  return (
    <form
      id={id}
      className="payment-receipt"
      aria-labelledby={`${uid}-title`}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (busy) return;
        const number = normalizeTrackingNumber(tracking);
        if (!image) {
          setImageError(c.receiptRequired);
          fileRef.current?.focus();
          return;
        }
        if (!number) {
          setTrackingError(c.trackingError);
          trackingRef.current?.focus();
          return;
        }
        onSubmit({ receiptImage: image, trackingNumber: number });
      }}
    >
      <h2 id={`${uid}-title`}>{c.receiptTitle}</h2>

      <input
        ref={fileRef}
        id={`${uid}-file`}
        className="payment-drop-input"
        type="file"
        accept={RECEIPT_TYPES.join(",")}
        onChange={onChange}
        disabled={busy}
        aria-invalid={imageError ? true : undefined}
        aria-describedby={`${uid}-file-hint${imageError ? ` ${uid}-file-error` : ""}`}
      />
      <label
        htmlFor={`${uid}-file`}
        className={`payment-drop${dragging ? " is-dragging" : ""}${image ? " has-image" : ""}${imageError ? " is-invalid" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {image ? (
          <>
            <img src={image} alt={c.receiptPreviewAlt} />
            <span className="payment-drop-file">
              <b dir="auto">{fileName}</b>
              <span>
                <RefreshCw aria-hidden="true" />
                {c.receiptChange}
              </span>
            </span>
          </>
        ) : (
          <>
            <ImageUp className="payment-drop-icon" aria-hidden="true" />
            <b>{c.receiptDrop}</b>
            <span id={`${uid}-file-hint`}>{c.receiptDropHint}</span>
          </>
        )}
      </label>
      {imageError ? (
        <p id={`${uid}-file-error`} className="checkout-field-error" role="alert">
          {imageError}
        </p>
      ) : null}

      <div className={`checkout-field${trackingError ? " is-invalid" : ""}`}>
        <label htmlFor={`${uid}-tracking`}>{c.trackingLabel}</label>
        <input
          ref={trackingRef}
          id={`${uid}-tracking`}
          className="checkout-ltr-field"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          dir="ltr"
          value={tracking}
          onChange={(event) => {
            setTracking(event.target.value);
            setTrackingError("");
          }}
          disabled={busy}
          aria-invalid={trackingError ? true : undefined}
          aria-describedby={trackingError ? `${uid}-tracking-error` : `${uid}-tracking-hint`}
        />
        {trackingError ? (
          <p id={`${uid}-tracking-error`} className="checkout-field-error" role="alert">
            {trackingError}
          </p>
        ) : (
          <p id={`${uid}-tracking-hint`} className="checkout-field-hint">
            {c.trackingHint}
          </p>
        )}
      </div>
    </form>
  );
}
