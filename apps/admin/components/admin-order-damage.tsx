"use client";

import { useId } from "react";
import type { AdminDamageReport } from "../lib/admin-data";
import { AdminDamageReportItem, type DamageReview } from "./admin-damage-report";

const number = new Intl.NumberFormat("fa-IR");

/** Damage claims filed against one order, read beside its delivery facts. */
export function AdminOrderDamage({
  reports,
  canWrite,
  onReview,
}: {
  reports: AdminDamageReport[];
  canWrite: boolean;
  onReview: (id: string, review: DamageReview) => Promise<boolean>;
}) {
  const id = useId();
  if (!reports.length) return null;
  const open = reports.filter(
    (report) => report.status === "submitted" || report.status === "reviewing",
  ).length;

  return (
    <section className="order-messages" aria-labelledby={`${id}-title`}>
      <h4 id={`${id}-title`}>
        گزارش آسیب
        <span>
          {number.format(reports.length)} گزارش
          {open ? ` · ${number.format(open)} باز` : ""}
        </span>
      </h4>
      <div className="contact-message-list is-compact">
        {reports.map((report) => (
          <AdminDamageReportItem
            key={report.id}
            report={report}
            canWrite={canWrite}
            onReview={onReview}
          />
        ))}
      </div>
    </section>
  );
}
