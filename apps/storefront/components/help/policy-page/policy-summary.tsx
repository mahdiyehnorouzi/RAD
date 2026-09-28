"use client";

import { useLocale } from "@/components/i18n";
import { helpCopy } from "../const";
import type { PolicyPoint } from "../type";

/** The "in short" lines: what the text commits to, before its clauses. */
export function PolicySummary({ points }: { points: PolicyPoint[] }) {
  const { locale } = useLocale();

  return (
    <section className="policy-summary" aria-labelledby="policy-summary-title">
      <h2 id="policy-summary-title">{helpCopy[locale].inShort}</h2>
      <dl>
        {points.map((point) => (
          <div key={point.id}>
            <dt>{point.label[locale]}</dt>
            <dd>{point.value[locale]}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
