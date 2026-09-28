"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLocale } from "@/components/i18n";
import {
  GUIDE_DOCUMENTS,
  currentPolicyVersion,
  helpCopy,
  policyPath,
} from "../const";
import { PolicyIcon } from "../fine-print";

/** The four plain-language guides, each carrying its two most asked-for facts. */
export function HelpTopics() {
  const { locale, href } = useLocale();
  const c = helpCopy[locale];
  const Forward = locale === "fa" ? ArrowLeft : ArrowRight;

  return (
    <ul className="help-topics">
      {GUIDE_DOCUMENTS.map((doc) => (
        <li key={doc.slug}>
          <Link
            className={`help-topic is-${doc.slug}`}
            href={href(policyPath(doc.slug))}
          >
            <span className="help-topic-mark" aria-hidden="true">
              <PolicyIcon name={doc.icon} size={20} />
            </span>
            <span className="help-topic-head">
              <strong>{doc.title[locale]}</strong>
              <span>{doc.summary[locale]}</span>
            </span>
            <dl className="help-topic-facts">
              {currentPolicyVersion(doc)
                .points.slice(0, 2)
                .map((point) => (
                  <div key={point.id}>
                    <dt>{point.label[locale]}</dt>
                    <dd>{point.value[locale]}</dd>
                  </div>
                ))}
            </dl>
            <span className="help-topic-more">
              {c.readMore}
              <Forward size={16} strokeWidth={1.6} aria-hidden="true" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
