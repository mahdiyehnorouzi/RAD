"use client";

import { Sprout } from "lucide-react";
import { useLocale } from "@/components/i18n";
import { helpCopy } from "../const";
import { PolicyIcon } from "../fine-print";
import type { PolicyPoint } from "../type";

/** A one- or two-word answer ("Never", "15 minutes") reads as a verdict. */
function isVerdict(value: string) {
  return value.trim().split(/\s+/).length <= 2;
}

/** The "in short" lines: what the text commits to, before its clauses. */
export function PolicySummary({ points }: { points: PolicyPoint[] }) {
  const { locale } = useLocale();

  return (
    <section className="policy-summary" aria-labelledby="policy-summary-title">
      <h2 id="policy-summary-title" className="policy-card-title">
        <Sprout size={20} strokeWidth={1.6} aria-hidden="true" />
        {helpCopy[locale].inShort}
      </h2>
      <ul>
        {points.map((point) => {
          const value = point.value[locale];
          const verdict = isVerdict(value);
          return (
            <li key={point.id} className={verdict ? "is-verdict" : undefined}>
              <span className="policy-point-icon">
                <PolicyIcon name={point.icon} size={20} />
              </span>
              <span className="policy-point-copy">
                <strong>{point.label[locale]}</strong>
                {verdict ? null : <span>{value}</span>}
              </span>
              {verdict ? (
                <strong className="policy-point-verdict">{value}</strong>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
