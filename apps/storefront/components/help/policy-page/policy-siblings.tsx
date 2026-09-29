"use client";

import Link from "next/link";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import type { PolicySlug } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { GUIDE_DOCUMENTS, helpCopy, policyPath } from "../const";
import { PolicyIcon } from "../fine-print";

/** The other plain-language guides, so a reader never dead-ends on one text. */
export function PolicySiblings({ current }: { current: PolicySlug }) {
  const { locale, href } = useLocale();
  const docs = GUIDE_DOCUMENTS.filter((doc) => doc.slug !== current);
  const Forward = locale === "fa" ? ChevronLeft : ChevronRight;

  return (
    <section
      className="policy-siblings"
      aria-labelledby="policy-siblings-title"
    >
      <h2 id="policy-siblings-title" className="policy-card-title">
        <BookOpen size={18} strokeWidth={1.6} aria-hidden="true" />
        {helpCopy[locale].otherGuides}
      </h2>
      <ul>
        {docs.map((doc) => (
          <li key={doc.slug}>
            <Link href={href(policyPath(doc.slug))}>
              <span className="policy-siblings-icon">
                <PolicyIcon name={doc.icon} size={18} />
              </span>
              <span className="policy-siblings-copy">
                <strong>{doc.title[locale]}</strong>
                <small>{doc.summary[locale]}</small>
              </span>
              <Forward
                className="policy-siblings-arrow"
                size={16}
                strokeWidth={1.6}
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
