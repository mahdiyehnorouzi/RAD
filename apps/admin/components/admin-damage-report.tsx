"use client";

import { useId, useState } from "react";
import { AlertTriangle, Eye, Phone } from "lucide-react";
import {
  damageResolutionLabels,
  damageStatusLabels,
  type AdminDamageReport,
  type AdminOrder,
} from "../lib/admin-data";

export type DamageReview = {
  status: AdminDamageReport["status"];
  resolution?: AdminDamageReport["resolution"];
  note?: string;
};

type Decision = "repair" | "refund" | "declined";

const dateTime = (value: number) =>
  new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(value);

/** One transit-damage claim: the two photos, the customer's note, and the decision. */
export function AdminDamageReportItem({
  report,
  order,
  canWrite,
  onReview,
  onOpenOrder,
}: {
  report: AdminDamageReport;
  order?: AdminOrder;
  canWrite: boolean;
  onReview: (id: string, review: DamageReview) => Promise<boolean>;
  onOpenOrder?: (orderId: string) => void;
}) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [deciding, setDeciding] = useState(false);
  const [decision, setDecision] = useState<Decision>("repair");
  const [note, setNote] = useState("");
  const [enlarged, setEnlarged] = useState<string | null>(null);
  const open = report.status === "submitted" || report.status === "reviewing";
  const noteRequired = decision === "declined";

  const send = async (review: DamageReview) => {
    setBusy(true);
    const ok = await onReview(report.id, review);
    setBusy(false);
    if (ok) setDeciding(false);
  };

  const decide = () =>
    send(
      decision === "declined"
        ? { status: "declined", note: note.trim() }
        : { status: "approved", resolution: decision, note: note.trim() || undefined },
    );

  return (
    <article className={`contact-message damage-claim is-${report.status}`}>
      <header>
        <div>
          <strong>{report.customer || "مشتری"}</strong>
          <small>
            {damageStatusLabels[report.status]}
            {report.signedIn ? " · حساب کاربری" : " · مهمان"}
            {report.deliveredAt ? ` · تحویل ${dateTime(report.deliveredAt)}` : " · زمان تحویل ثبت نشده"}
          </small>
        </div>
        <time dateTime={new Date(report.createdAt).toISOString()}>{dateTime(report.createdAt)}</time>
      </header>

      <div className="damage-claim-photos">
        {[
          { src: report.packagingPhoto, label: "جعبه، همان‌طور که رسید" },
          { src: report.damagePhoto, label: "خود آسیب" },
        ].map((photo) => (
          <figure key={photo.label}>
            <button
              type="button"
              className={enlarged === photo.src ? "is-enlarged" : ""}
              onClick={() => setEnlarged((current) => (current === photo.src ? null : photo.src))}
              aria-pressed={enlarged === photo.src}
              aria-label={`بزرگ‌نمایی عکس ${photo.label}`}
            >
              <img src={photo.src} alt={photo.label} />
            </button>
            <figcaption>{photo.label}</figcaption>
          </figure>
        ))}
      </div>

      <p className="contact-message-body">{report.body}</p>

      {report.resolution || report.note ? (
        <div className="damage-claim-decision">
          {report.resolution ? <strong>جبران: {damageResolutionLabels[report.resolution]}</strong> : null}
          {report.note ? <p>پاسخ به مشتری: {report.note}</p> : null}
          {report.reviewedAt ? <small>تصمیم در {dateTime(report.reviewedAt)}</small> : null}
        </div>
      ) : null}

      <footer>
        {report.phone ? (
          <a className="contact-message-reply" href={`tel:${report.phone}`} dir="ltr">
            <Phone aria-hidden="true" />
            {report.phone}
          </a>
        ) : null}
        {onOpenOrder ? (
          <button type="button" className="contact-message-order" onClick={() => onOpenOrder(report.orderId)}>
            سفارش <bdi dir="ltr">#{report.orderId}</bdi>
            {order ? ` · ${order.productName}` : ""}
          </button>
        ) : null}
        {report.late ? (
          <span className="contact-message-flag">
            <AlertTriangle aria-hidden="true" />
            بعد از مهلت ۲۴ ساعته فرستاده شده
          </span>
        ) : null}
        {canWrite && report.status === "submitted" ? (
          <button
            type="button"
            className="secondary-action contact-message-toggle"
            onClick={() => send({ status: "reviewing" })}
            disabled={busy}
          >
            <Eye aria-hidden="true" /> شروع بررسی
          </button>
        ) : null}
        {canWrite && open && !deciding ? (
          <button
            type="button"
            className="primary-action damage-claim-decide"
            onClick={() => setDeciding(true)}
            disabled={busy}
          >
            تصمیم
          </button>
        ) : null}
      </footer>

      {canWrite && open && deciding ? (
        <form
          className="order-payment-reject damage-claim-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (noteRequired && !note.trim()) return;
            void decide();
          }}
        >
          <fieldset>
            <legend>نتیجه‌ی بررسی</legend>
            {(
              [
                ["repair", "تأیید — مرمت به دست سازنده (رفت‌وبرگشت با رَد)"],
                ["refund", "تأیید — بازگشت کامل مبلغ اثر"],
                ["declined", "تأیید نشد"],
              ] as const
            ).map(([value, label]) => (
              <label key={value}>
                <input
                  type="radio"
                  name={`${id}-decision`}
                  value={value}
                  checked={decision === value}
                  onChange={() => setDecision(value)}
                />
                {label}
              </label>
            ))}
          </fieldset>
          <label htmlFor={`${id}-note`}>
            {noteRequired ? "دلیل، برای مشتری (لازم)" : "توضیح برای مشتری (اختیاری)"}
          </label>
          <textarea
            id={`${id}-note`}
            rows={3}
            maxLength={1000}
            value={note}
            required={noteRequired}
            onChange={(event) => setNote(event.target.value)}
          />
          <div className="order-payment-actions">
            <button type="submit" className="primary-action" disabled={busy || (noteRequired && !note.trim())}>
              ثبت تصمیم
            </button>
            <button type="button" className="secondary-action" onClick={() => setDeciding(false)} disabled={busy}>
              انصراف
            </button>
          </div>
        </form>
      ) : null}
    </article>
  );
}
