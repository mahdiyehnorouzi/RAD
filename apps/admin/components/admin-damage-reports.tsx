"use client";

import { useMemo, useState } from "react";
import type { AdminDamageReport, AdminOrder } from "../lib/admin-data";
import { AdminDamageReportItem, type DamageReview } from "./admin-damage-report";

type Filter = "open" | "decided" | "all";

const number = new Intl.NumberFormat("fa-IR");
const filters: { id: Filter; label: string }[] = [
  { id: "open", label: "باز" },
  { id: "decided", label: "تصمیم‌گرفته" },
  { id: "all", label: "همه" },
];
const isOpen = (report: AdminDamageReport) =>
  report.status === "submitted" || report.status === "reviewing";

/** Transit-damage claims from order pages; each also appears on its order card. */
export function AdminDamageReports({
  reports,
  orders,
  canWrite,
  onReview,
  onOpenOrder,
}: {
  reports: AdminDamageReport[];
  orders: AdminOrder[];
  canWrite: boolean;
  onReview: (id: string, review: DamageReview) => Promise<boolean>;
  onOpenOrder: (orderId: string) => void;
}) {
  const [filter, setFilter] = useState<Filter>("open");
  const counts = useMemo(
    () => ({
      open: reports.filter(isOpen).length,
      decided: reports.filter((report) => !isOpen(report)).length,
      all: reports.length,
    }),
    [reports],
  );
  const visible =
    filter === "all"
      ? reports
      : reports.filter((report) => (filter === "open" ? isOpen(report) : !isOpen(report)));
  const orderById = useMemo(() => new Map(orders.map((order) => [order.id, order])), [orders]);

  return (
    <section className="paper-panel data-view">
      <div className="view-heading">
        <div>
          <h2>گزارش‌های آسیب</h2>
          <p>
            مشتری تا ۲۴ ساعت بعد از تحویل، با عکس جعبه و عکس آسیب گزارش می‌دهد. گزارش دیرتر هم
            پذیرفته و علامت‌گذاری می‌شود. جبران: مرمت به دست سازنده یا بازگشت کامل مبلغ.
          </p>
        </div>
      </div>

      <div className="message-filters" role="group" aria-label="فیلتر گزارش‌های آسیب">
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
          {visible.map((report) => (
            <AdminDamageReportItem
              key={report.id}
              report={report}
              order={orderById.get(report.orderId)}
              canWrite={canWrite}
              onReview={onReview}
              onOpenOrder={onOpenOrder}
            />
          ))}
        </div>
      ) : (
        <p className="contact-message-empty">
          {filter === "open" ? "گزارش بازی نیست." : "هنوز گزارشی در این دسته نیست."}
        </p>
      )}
    </section>
  );
}
