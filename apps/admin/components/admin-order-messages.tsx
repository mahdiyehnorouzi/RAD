"use client";

import { useId, useMemo } from "react";
import type { AdminContactMessage } from "../lib/admin-data";
import { AdminContactMessageItem } from "./admin-contact-message";

const number = new Intl.NumberFormat("fa-IR");

/** Customer messages filed against one order, read beside its receipt. */
export function AdminOrderMessages({
  messages,
  canWrite,
  onSetStatus,
  onReply,
}: {
  messages: AdminContactMessage[];
  canWrite: boolean;
  onSetStatus: (id: string, status: AdminContactMessage["status"]) => Promise<void>;
  onReply: (id: string, body: string) => Promise<void>;
}) {
  const id = useId();
  const roots = useMemo(
    () => messages.filter((message) => !message.parentId),
    [messages],
  );
  const repliesByRoot = useMemo(() => {
    const map = new Map<string, AdminContactMessage[]>();
    for (const message of messages) {
      if (!message.parentId) continue;
      const list = map.get(message.parentId) ?? [];
      list.push(message);
      map.set(message.parentId, list);
    }
    // `messages` is the bulk inbox fetch (newest-first); a thread must read
    // oldest-first like a real conversation.
    for (const list of map.values()) list.sort((a, b) => a.createdAt - b.createdAt);
    return map;
  }, [messages]);
  if (!roots.length) return null;
  const open = roots.filter((message) => message.status === "new").length;

  return (
    <section className="order-messages" aria-labelledby={`${id}-title`}>
      <h4 id={`${id}-title`}>
        پیام‌های مشتری درباره‌ی این سفارش
        <span>
          {number.format(roots.length)} پیام
          {open ? ` · ${number.format(open)} رسیدگی‌نشده` : ""}
        </span>
      </h4>
      <div className="contact-message-list is-compact">
        {roots.map((message) => (
          <AdminContactMessageItem
            key={message.id}
            message={message}
            replies={repliesByRoot.get(message.id) ?? []}
            canWrite={canWrite}
            onSetStatus={onSetStatus}
            onReply={onReply}
          />
        ))}
      </div>
    </section>
  );
}
