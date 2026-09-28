"use client";

import { useState } from "react";
import { AlertTriangle, Check, Mail, Phone, RotateCcw } from "lucide-react";
import {
  contactSourceLabels,
  contactTopicLabels,
  orderStatusLabels,
  type AdminContactMessage,
  type AdminOrder,
} from "../lib/admin-data";

const dateTime = (value: number) =>
  new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);

/** One customer message, shown in the inbox and beside its order. */
export function AdminContactMessageItem({
  message,
  order,
  canWrite,
  onSetStatus,
  onOpenOrder,
}: {
  message: AdminContactMessage;
  /** The linked order, when it should be shown as a jump link. */
  order?: AdminOrder;
  canWrite: boolean;
  onSetStatus: (id: string, status: AdminContactMessage["status"]) => Promise<void>;
  onOpenOrder?: (orderId: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const isEmail = message.contact.includes("@");
  const resolved = message.status === "resolved";

  const toggle = async () => {
    setBusy(true);
    await onSetStatus(message.id, resolved ? "new" : "resolved");
    setBusy(false);
  };

  return (
    <article className={`contact-message is-${message.status}`}>
      <header>
        <div>
          <strong>{message.name || message.contact}</strong>
          <small>
            {contactTopicLabels[message.topic]} · {contactSourceLabels[message.source]}
            {message.signedIn ? " · حساب کاربری" : " · مهمان"}
          </small>
        </div>
        <time dateTime={new Date(message.createdAt).toISOString()}>
          {dateTime(message.createdAt)}
        </time>
      </header>

      <p className="contact-message-body">{message.body}</p>

      <footer>
        <a
          className="contact-message-reply"
          href={isEmail ? `mailto:${message.contact}` : `tel:${message.contact}`}
          dir="ltr"
        >
          {isEmail ? <Mail aria-hidden="true" /> : <Phone aria-hidden="true" />}
          {message.contact}
        </a>

        {message.orderId && onOpenOrder ? (
          <button
            type="button"
            className="contact-message-order"
            onClick={() => onOpenOrder(message.orderId!)}
          >
            سفارش <bdi dir="ltr">#{message.orderId}</bdi>
            {order ? ` · ${orderStatusLabels[order.status]}` : ""}
          </button>
        ) : null}

        {message.orderId && !message.fromOrderOwner ? (
          <span className="contact-message-flag">
            <AlertTriangle aria-hidden="true" />
            شماره‌ی سفارش را کسی جز خریدار وارد کرده
          </span>
        ) : null}

        {resolved && message.resolvedAt ? (
          <span className="contact-message-done">
            <Check aria-hidden="true" /> رسیدگی شد · {dateTime(message.resolvedAt)}
          </span>
        ) : null}

        {canWrite ? (
          <button
            type="button"
            className="secondary-action contact-message-toggle"
            onClick={toggle}
            disabled={busy}
          >
            {resolved ? (
              <>
                <RotateCcw aria-hidden="true" /> بازکردن دوباره
              </>
            ) : (
              <>
                <Check aria-hidden="true" /> رسیدگی شد
              </>
            )}
          </button>
        ) : null}
      </footer>
    </article>
  );
}
