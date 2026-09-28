"use client";

import type { DamageReport } from "@rad/types";
import { useLocale } from "@/components/i18n";
import {
  DAMAGE_RESOLUTION_LABELS,
  DAMAGE_STATUS_LABELS,
  damageReportCopy,
} from "./const";

export function DamageReportItem({ report }: { report: DamageReport }) {
  const { locale } = useLocale();
  const c = damageReportCopy[locale];
  const sentOn = new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(report.createdAt);

  return (
    <li className={`damage-item is-${report.status}`}>
      <div className="damage-item-head">
        <span className="damage-status">
          {DAMAGE_STATUS_LABELS[report.status][locale]}
        </span>
        <small>
          {c.sentOn.replace("{date}", sentOn)}
          {report.late ? ` · ${c.late}` : ""}
        </small>
      </div>
      <p className="damage-item-body">{report.body}</p>
      <div className="damage-item-photos">
        <img src={report.packagingPhoto} alt={c.packagingAlt} />
        <img src={report.damagePhoto} alt={c.damageAlt} />
      </div>
      {report.resolution ? (
        <p className="damage-item-reply">
          <strong>{c.resolution}:</strong>{" "}
          {DAMAGE_RESOLUTION_LABELS[report.resolution][locale]}
        </p>
      ) : null}
      {report.note ? (
        <p className="damage-item-reply">
          <strong>{c.ourNote}:</strong> {report.note}
        </p>
      ) : null}
    </li>
  );
}
