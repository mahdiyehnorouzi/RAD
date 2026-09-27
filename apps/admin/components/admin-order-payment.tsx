"use client";

import { useId, useState } from "react";
import { Check, X } from "lucide-react";
import {
  paymentRejectionReasons,
  type AdminOrder,
} from "../lib/admin-data";

const number = new Intl.NumberFormat("fa-IR");
const money = (value: number) => `${number.format(value)} تومان`;
const dateTime = (value: number) =>
  new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);

/**
 * Card-to-card receipt review for one shop order: amount, receipt, bank
 * tracking number, and RAD's confirm / reject decision.
 */
export function AdminOrderPayment({
  order,
  canWrite,
  onApprove,
  onReject,
}: {
  order: AdminOrder;
  canWrite: boolean;
  /** Resolves `false` when the request failed (the parent announces why). */
  onApprove: (id: string) => Promise<boolean>;
  onReject: (id: string, reason: string) => Promise<boolean>;
}) {
  const id = useId();
  const [mode, setMode] = useState<"idle" | "approve" | "reject">("idle");
  const [preset, setPreset] = useState<string>(paymentRejectionReasons[0]);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const amount = order.paymentAmount ?? order.amount;
  const reviewable = order.status === "pending_verification" && canWrite;
  const reason = (preset === "other" ? custom : preset).trim();

  const run = async (action: () => Promise<boolean>) => {
    setBusy(true);
    const ok = await action();
    setBusy(false);
    if (!ok) return;
    setMode("idle");
    setCustom("");
  };

  return (
    <section
      className={`order-payment is-${order.status}`}
      aria-labelledby={`${id}-title`}
    >
      <h4 id={`${id}-title`}>پرداخت کارت‌به‌کارت</h4>
      <dl className="order-facts">
        <div>
          <dt>مبلغ سفارش</dt>
          <dd>{money(amount)}</dd>
        </div>
        <div>
          <dt>شماره پیگیری واریز</dt>
          <dd dir="ltr">{order.paymentTrackingNumber ?? "—"}</dd>
        </div>
        <div>
          <dt>ارسال رسید</dt>
          <dd>
            {order.paymentSubmittedAt
              ? dateTime(order.paymentSubmittedAt)
              : "هنوز ارسال نشده"}
            {order.receiptSubmissions && order.receiptSubmissions > 1
              ? ` · ${number.format(order.receiptSubmissions)} بار`
              : ""}
          </dd>
        </div>
      </dl>

      {order.receiptImage ? (
        <a
          className="order-receipt-thumb"
          href={order.receiptImage}
          target="_blank"
          rel="noreferrer"
        >
          <img src={order.receiptImage} alt={`رسید سفارش ${order.id}`} />
        </a>
      ) : null}

      {order.status === "pending_payment" ? (
        <p className="order-payment-note">
          منتظر واریز مشتری
          {order.paymentDueAt
            ? `؛ اگر تا ${dateTime(order.paymentDueAt)} رسید نرسد، سفارش منقضی و اثر آزاد می‌شود.`
            : "."}
        </p>
      ) : null}

      {order.status === "expired" ? (
        <p className="order-payment-note">
          مهلت پرداخت تمام شد و اثر به فروشگاه برگشت.
        </p>
      ) : null}

      {order.paymentStatus === "verified" && order.paymentReviewedAt ? (
        <p className="order-payment-note is-verified">
          <Check aria-hidden="true" /> پرداخت در {dateTime(order.paymentReviewedAt)}{" "}
          تأیید شد.
        </p>
      ) : null}

      {order.status === "rejected" ? (
        <div className="order-payment-rejected" role="status">
          <strong>پرداخت رد شد</strong>
          {order.rejectionReason ? <p>دلیل: {order.rejectionReason}</p> : null}
        </div>
      ) : null}

      {order.status === "pending_verification" && !canWrite ? (
        <p className="order-payment-note">
          رسید منتظر تأیید است؛ نقش شما اجازهٔ تصمیم ندارد.
        </p>
      ) : null}

      {reviewable && mode === "idle" ? (
        <div className="order-payment-actions">
          <button
            className="primary-action"
            type="button"
            onClick={() => setMode("approve")}
          >
            <Check aria-hidden="true" /> تأیید پرداخت
          </button>
          <button
            className="danger-action"
            type="button"
            onClick={() => setMode("reject")}
          >
            <X aria-hidden="true" /> رد پرداخت
          </button>
        </div>
      ) : null}

      {reviewable && mode === "approve" ? (
        <div className="order-payment-confirm" role="group" aria-label="تأیید پرداخت">
          <p>
            مبلغ روی رسید دقیقاً <b>{money(amount)}</b> است و واریز با شماره
            پیگیری <b dir="ltr">{order.paymentTrackingNumber ?? "—"}</b> در حساب
            رَد دیده می‌شود؟ با تأیید، اثر فروخته‌شده ثبت و به مشتری اطلاع داده
            می‌شود.
          </p>
          <div className="order-payment-actions">
            <button
              className="primary-action"
              type="button"
              disabled={busy}
              onClick={() => run(() => onApprove(order.id))}
            >
              {busy ? "در حال ثبت…" : "بله، پرداخت تأیید شود"}
            </button>
            <button
              className="secondary-action"
              type="button"
              disabled={busy}
              onClick={() => setMode("idle")}
            >
              انصراف
            </button>
          </div>
        </div>
      ) : null}

      {reviewable && mode === "reject" ? (
        <form
          className="order-payment-reject"
          onSubmit={(event) => {
            event.preventDefault();
            if (reason.length < 3) return;
            void run(() => onReject(order.id, reason));
          }}
        >
          <fieldset>
            <legend>دلیل رد پرداخت (برای مشتری نمایش داده می‌شود)</legend>
            {paymentRejectionReasons.map((item) => (
              <label key={item}>
                <input
                  type="radio"
                  name={`${id}-reason`}
                  value={item}
                  checked={preset === item}
                  onChange={() => setPreset(item)}
                />
                {item}
              </label>
            ))}
            <label>
              <input
                type="radio"
                name={`${id}-reason`}
                value="other"
                checked={preset === "other"}
                onChange={() => setPreset("other")}
              />
              دلیل دیگر
            </label>
            {preset === "other" ? (
              <textarea
                aria-label="دلیل دیگر"
                value={custom}
                onChange={(event) => setCustom(event.target.value)}
                rows={3}
                maxLength={500}
                required
              />
            ) : null}
          </fieldset>
          <p className="order-payment-note">
            با رد پرداخت، سفارش بسته می‌شود و اثر دوباره در فروشگاه قابل خرید است.
          </p>
          <div className="order-payment-actions">
            <button
              className="danger-action"
              type="submit"
              disabled={busy || reason.length < 3}
            >
              {busy ? "در حال ثبت…" : "ثبت رد پرداخت"}
            </button>
            <button
              className="secondary-action"
              type="button"
              disabled={busy}
              onClick={() => setMode("idle")}
            >
              انصراف
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
