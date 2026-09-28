"use client";

import Link from "next/link";
import { useLocale } from "@/components/i18n";
import { formatPolicyDate, helpCopy, policyVersionPath } from "../const";
import type { PolicyDocument } from "../type";

/** Every published version stays readable; orders link to the one they accepted. */
export function PolicyHistory({
  doc,
  viewing,
}: {
  doc: PolicyDocument;
  viewing: string;
}) {
  const { locale, href } = useLocale();
  const c = helpCopy[locale];

  return (
    <section
      id="history"
      className="policy-history"
      aria-labelledby="policy-history-title"
    >
      <h2 id="policy-history-title">{c.history}</h2>
      <ol>
        {doc.versions.map((version, index) => {
          const isViewing = version.id === viewing;
          const date = formatPolicyDate(version.id, locale);
          return (
            <li
              key={version.id}
              className={isViewing ? "is-viewing" : undefined}
            >
              {isViewing ? (
                <span className="policy-history-date" aria-current="page">
                  {date}
                </span>
              ) : (
                <Link
                  className="policy-history-date"
                  href={href(policyVersionPath(doc.slug, version.id))}
                >
                  {date}
                </Link>
              )}
              <span className="policy-history-change">
                {version.change[locale]}
              </span>
              <span className="policy-history-tags">
                {index === 0 ? <span>{c.current}</span> : null}
                {isViewing ? (
                  <span className="is-viewing">{c.viewing}</span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
