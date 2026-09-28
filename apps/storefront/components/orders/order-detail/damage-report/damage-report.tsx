"use client";
import "./damage-report.css";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DAMAGE_REPORT_WINDOW_HOURS,
  type DamageReport,
  type Order,
} from "@rad/types";
import { useLocale } from "@/components/i18n";
import { Button } from "@/components/ui/button-link";
import { fetchDamageReports } from "@/lib/api";
import { damageReportCopy } from "./const";
import { DamageReportForm } from "./damage-report-form";
import { DamageReportItem } from "./damage-report-item";

const REPORTABLE: Order["status"][] = ["shipped", "delivered"];
const OPEN: DamageReport["status"][] = ["submitted", "reviewing"];

/** Transit-damage report: two photos, a note, and the review status on this page. */
export function DamageReportPanel({ order }: { order: Order }) {
  const { locale, href } = useLocale();
  const c = damageReportCopy[locale];
  const [reports, setReports] = useState<DamageReport[]>([]);
  const [writing, setWriting] = useState(false);
  const [sent, setSent] = useState(false);
  const [now] = useState(() => Date.now());
  const reportable = REPORTABLE.includes(order.status);

  useEffect(() => {
    let cancelled = false;
    fetchDamageReports(order.id)
      .then((list) => {
        if (!cancelled) setReports(list);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [order.id]);

  if (!reportable && !reports.length) return null;

  const hasOpen = reports.some((report) => OPEN.includes(report.status));
  const deadlineAt = order.deliveredAt
    ? order.deliveredAt + DAMAGE_REPORT_WINDOW_HOURS * 60 * 60 * 1000
    : undefined;
  const deadline =
    deadlineAt === undefined
      ? c.deadlineUnknown
      : deadlineAt < now
        ? c.deadlinePassed
        : c.deadline.replace(
            "{date}",
            new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-GB", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(deadlineAt),
          );

  return (
    <section className="damage-report" aria-labelledby="damage-report-title">
      <h2 id="damage-report-title">{c.title}</h2>
      {reportable ? (
        <>
          <p className="damage-lede">{c.lede}</p>
          <p className="damage-deadline">{deadline}</p>
          <p className="damage-compensation">
            {c.compensation}{" "}
            <Link href={href("/help/returns#damage")}>{c.fullRule}</Link>
          </p>
        </>
      ) : null}

      {sent ? (
        <p className="damage-sent" role="status">
          {c.sent}
        </p>
      ) : null}

      {reportable && !hasOpen ? (
        writing ? (
          <DamageReportForm
            orderId={order.id}
            onCancel={() => setWriting(false)}
            onSent={(report) => {
              setReports((current) => [report, ...current]);
              setWriting(false);
              setSent(true);
            }}
          />
        ) : (
          <div className="damage-open">
            <Button outline onClick={() => setWriting(true)}>
              {c.open}
            </Button>
          </div>
        )
      ) : null}

      {reports.length ? (
        <div className="damage-reports">
          <h3>{c.reportsTitle}</h3>
          <ul>
            {reports.map((report) => (
              <DamageReportItem key={report.id} report={report} />
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
