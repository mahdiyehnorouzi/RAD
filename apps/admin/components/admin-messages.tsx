"use client";

import { useMemo, useState } from "react";
import type { AdminContactMessage, AdminOrder } from "../lib/admin-data";
import { AdminContactMessageItem } from "./admin-contact-message";

type Filter = "new" | "resolved" | "all";

const number = new Intl.NumberFormat("fa-IR");
const filters: { id: Filter; label: string }[] = [
  { id: "new", label: "رسیدگی‌نشده" },
  { id: "resolved", label: "رسیدگی‌شده" },
  { id: "all", label: "همه" },
];

/**
 * Messages from the contact page and the checkout / order help panels.
 * Order-linked messages also appear on their order card.
 */
export function AdminMessages({
  messages,
  orders,
  canWrite,
  onSetStatus,
  onOpenOrder,
}: {
  messages: AdminContactMessage[];
  orders: AdminOrder[];
  canWrite: boolean;
  onSetStatus: (id: string, status: AdminContactMessage["status"]) => Promise<void>;
  onOpenOrder: (orderId: string) => void;
}) {
  const [filter, setFilter] = useState<Filter>("new");
  const counts = useMemo(
    () => ({
      new: messages.filter((message) => message.status === "new").length,
      resolved: messages.filter((message) => message.status === "resolved").length,
      all: messages.length,
    }),
    [messages],
  );
  const visible =
    filter === "all" ? messages : messages.filter((message) => message.status === filter);
  const orderById = useMemo(
    () => new Map(orders.map((order) => [order.id, order])),
    [orders],
  );

  return (
    <section className="paper-panel data-view">
      <div className="view-heading">
        <div>
          <h2>پیام‌ها</h2>
          <p>
            پیام‌های فرم «حرف بزنیم» و راهنمای صفحه‌های تسویه و سفارش. پیامی که
            شماره‌ی سفارش دارد کنار همان سفارش هم دیده می‌شود.
          </p>
        </div>
      </div>

      <div className="message-filters" role="group" aria-label="فیلتر پیام‌ها">
        {filters.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={filter === id ? "active" : ""}
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
          >
            {label}
            <span>{number.format(counts[id])}</span>
          </button>
        ))}
      </div>

      {visible.length ? (
        <div className="contact-message-list">
          {visible.map((message) => (
            <AdminContactMessageItem
              key={message.id}
              message={message}
              order={message.orderId ? orderById.get(message.orderId) : undefined}
              canWrite={canWrite}
              onSetStatus={onSetStatus}
              onOpenOrder={onOpenOrder}
            />
          ))}
        </div>
      ) : (
        <p className="contact-message-empty">
          {filter === "new"
            ? "پیام رسیدگی‌نشده‌ای نیست."
            : "هنوز پیامی در این دسته نیست."}
        </p>
      )}
    </section>
  );
}
