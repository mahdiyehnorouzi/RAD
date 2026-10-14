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

/** One customer message thread (root + replies), shown in the inbox and beside its order. */
export function AdminContactMessageItem({
  message,
  replies = [],
  order,
  canWrite,
  onSetStatus,
  onReply,
  onOpenOrder,
}: {
  message: AdminContactMessage;
  /** Replies in this thread, oldest first. */
  replies?: AdminContactMessage[];
  /** The linked order, when it should be shown as a jump link. */
  order?: AdminOrder;
  canWrite: boolean;
  onSetStatus: (id: string, status: AdminContactMessage["status"]) => Promise<void>;
  onReply?: (id: string, body: string) => Promise<void>;
  onOpenOrder?: (orderId: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const isEmail = message.contact.includes("@");
  const resolved = message.status === "resolved";

  const toggle = async () => {
    setBusy(true);
    await onSetStatus(message.id, resolved ? "new" : "resolved");
    setBusy(false);
  };

  const sendReply = async () => {
    if (!onReply || !draft.trim()) return;
    setSending(true);
    try {
      await onReply(message.id, draft.trim());
      setDraft("");
    } finally {
      setSending(false);
    }
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

      {replies.length > 0 && (
        <ol className="contact-message-thread">
          {replies.map((reply) => (
            <li key={reply.id} className={reply.fromAdmin ? "from-admin" : "from-customer"}>
              <b>{reply.fromAdmin ? "دفتر کوره" : message.name || "مشتری"}</b>
              <span>{dateTime(reply.createdAt)}</span>
              <p>{reply.body}</p>
            </li>
          ))}
        </ol>
      )}

      {canWrite && onReply && (
        <div className="contact-message-reply-box">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="پاسخ به مشتری…"
            rows={2}
          />
          <button
            type="button"
            className="secondary-action"
            onClick={sendReply}
            disabled={sending || !draft.trim()}
          >
            {sending ? "در حال ارسال…" : "ارسال پاسخ"}
          </button>
        </div>
      )}

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
