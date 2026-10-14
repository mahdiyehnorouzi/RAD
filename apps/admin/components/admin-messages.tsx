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
  onReply,
  onOpenOrder,
}: {
  messages: AdminContactMessage[];
  orders: AdminOrder[];
  canWrite: boolean;
  onSetStatus: (id: string, status: AdminContactMessage["status"]) => Promise<void>;
  onReply: (id: string, body: string) => Promise<void>;
  onOpenOrder: (orderId: string) => void;
}) {
  const [filter, setFilter] = useState<Filter>("new");
  // Threads are flat: a root message (no parentId) plus every reply that
  // points at it. Filters/counts operate on roots only — a reply doesn't
  // need its own status, it belongs to its root's.
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
  const counts = useMemo(
    () => ({
      new: roots.filter((message) => message.status === "new").length,
      resolved: roots.filter((message) => message.status === "resolved").length,
      all: roots.length,
    }),
    [roots],
  );
  const visible =
    filter === "all" ? roots : roots.filter((message) => message.status === filter);
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
              replies={repliesByRoot.get(message.id) ?? []}
              order={message.orderId ? orderById.get(message.orderId) : undefined}
              canWrite={canWrite}
              onSetStatus={onSetStatus}
              onReply={onReply}
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
