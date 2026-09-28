"use client";

import { useId } from "react";
import type { AdminContactMessage } from "../lib/admin-data";
import { AdminContactMessageItem } from "./admin-contact-message";

const number = new Intl.NumberFormat("fa-IR");

/** Customer messages filed against one order, read beside its receipt. */
export function AdminOrderMessages({
  messages,
  canWrite,
  onSetStatus,
}: {
  messages: AdminContactMessage[];
  canWrite: boolean;
  onSetStatus: (id: string, status: AdminContactMessage["status"]) => Promise<void>;
}) {
  const id = useId();
  if (!messages.length) return null;
  const open = messages.filter((message) => message.status === "new").length;

  return (
    <section className="order-messages" aria-labelledby={`${id}-title`}>
      <h4 id={`${id}-title`}>
        پیام‌های مشتری درباره‌ی این سفارش
        <span>
          {number.format(messages.length)} پیام
          {open ? ` · ${number.format(open)} رسیدگی‌نشده` : ""}
        </span>
      </h4>
      <div className="contact-message-list is-compact">
        {messages.map((message) => (
          <AdminContactMessageItem
            key={message.id}
            message={message}
            canWrite={canWrite}
            onSetStatus={onSetStatus}
          />
        ))}
      </div>
    </section>
  );
}
