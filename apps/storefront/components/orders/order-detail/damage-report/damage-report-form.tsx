"use client";

import { useRef, useState, type FormEvent } from "react";
import type { DamageReport } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { Button } from "@/components/ui/button-link";
import { createDamageReport, errorMessage } from "@/lib/api";
import { damageReportCopy } from "./const";
import { DamagePhotoField } from "./damage-photo-field";

export function DamageReportForm({
  orderId,
  onSent,
  onCancel,
}: {
  orderId: string;
  onSent: (report: DamageReport) => void;
  onCancel: () => void;
}) {
  const { locale, t } = useLocale();
  const c = damageReportCopy[locale];
  const packagingRef = useRef<HTMLInputElement>(null);
  const damageRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [packagingPhoto, setPackagingPhoto] = useState("");
  const [damagePhoto, setDamagePhoto] = useState("");
  const [body, setBody] = useState("");
  const [tried, setTried] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;
    setTried(true);
    setError("");
    if (!packagingPhoto) return packagingRef.current?.focus();
    if (!damagePhoto) return damageRef.current?.focus();
    if (body.trim().length < 3) return bodyRef.current?.focus();

    try {
      setSending(true);
      onSent(
        await createDamageReport({
          orderId,
          packagingPhoto,
          damagePhoto,
          body: body.trim(),
        }),
      );
    } catch (err) {
      setError(errorMessage(err, t("requestFailed")));
    } finally {
      setSending(false);
    }
  };

  const photosMissing = tried && (!packagingPhoto || !damagePhoto);
  const bodyMissing = tried && body.trim().length < 3;

  return (
    <form className="damage-form" onSubmit={submit} noValidate>
      <div className="damage-photos">
        <DamagePhotoField
          ref={packagingRef}
          label={c.packagingLabel}
          alt={c.packagingAlt}
          value={packagingPhoto}
          invalid={tried}
          disabled={sending}
          onChange={setPackagingPhoto}
        />
        <DamagePhotoField
          ref={damageRef}
          label={c.damageLabel}
          alt={c.damageAlt}
          value={damagePhoto}
          invalid={tried}
          disabled={sending}
          onChange={setDamagePhoto}
        />
      </div>
      {photosMissing ? (
        <p className="damage-field-error">{c.photoRequired}</p>
      ) : null}

      <label className="damage-body-label" htmlFor={`damage-body-${orderId}`}>
        {c.bodyLabel}
      </label>
      <textarea
        ref={bodyRef}
        id={`damage-body-${orderId}`}
        rows={3}
        maxLength={2000}
        value={body}
        placeholder={c.bodyHint}
        aria-invalid={bodyMissing || undefined}
        aria-describedby={
          bodyMissing ? `damage-body-${orderId}-error` : undefined
        }
        disabled={sending}
        onChange={(event) => setBody(event.target.value)}
      />
      {bodyMissing ? (
        <p id={`damage-body-${orderId}-error`} className="damage-field-error">
          {c.bodyRequired}
        </p>
      ) : null}

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="damage-form-actions">
        <Button type="submit" disabled={sending}>
          {sending ? c.sending : c.submit}
        </Button>
        <button
          type="button"
          className="damage-cancel"
          onClick={onCancel}
          disabled={sending}
        >
          {c.cancel}
        </button>
      </div>
    </form>
  );
}
