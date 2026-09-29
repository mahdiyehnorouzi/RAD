"use client";
import "./fine-print.css";

import Link from "next/link";
import { ArrowLeft, ArrowRight, FileText } from "lucide-react";
import type { PolicySlug } from "@rad/types";
import { useLocale } from "@/components/i18n";
import {
  LEGAL_DOCUMENTS,
  currentPolicyVersion,
  formatPolicyDate,
  helpCopy,
  policyPath,
} from "../const";
import { PolicyIcon } from "./policy-icon";

/** The official texts, each with the date its current version was published. */
export function LegalTexts({ exclude }: { exclude?: PolicySlug }) {
  const { locale, href } = useLocale();
  const c = helpCopy[locale];
  const Forward = locale === "fa" ? ArrowLeft : ArrowRight;
  const docs = LEGAL_DOCUMENTS.filter((doc) => doc.slug !== exclude);
  if (!docs.length) return null;

  return (
    <section className="legal-texts" aria-labelledby="legal-texts-title">
      <h2 id="legal-texts-title">
        <FileText size={16} strokeWidth={1.6} aria-hidden="true" />
        {c.legalTitle}
      </h2>
      <ul>
        {docs.map((doc) => (
          <li key={doc.slug}>
            <Link href={href(policyPath(doc.slug))}>
              <PolicyIcon name={doc.icon} size={18} />
              <span className="legal-texts-copy">
                <strong>{doc.title[locale]}</strong>
                <small>
                  {c.updated}:{" "}
                  {formatPolicyDate(currentPolicyVersion(doc).id, locale)}
                </small>
              </span>
              <Forward size={16} strokeWidth={1.6} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
