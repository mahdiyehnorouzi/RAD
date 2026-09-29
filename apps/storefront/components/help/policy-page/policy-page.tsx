"use client";
import "./policy-page.css";

import Link from "next/link";
import { History } from "lucide-react";
import type { PolicySlug } from "@rad/types";
import { useLocale } from "@/components/i18n";
import {
  currentPolicyVersion,
  formatPolicyDate,
  helpCopy,
  policyDocument,
  policyPath,
  policyVersion,
} from "../const";
import { HelpContact, LegalTexts } from "../fine-print";
import { PolicyArticle } from "./policy-article";
import { PolicyContents } from "./policy-contents";
import { PolicyHistory } from "./policy-history";
import { PolicySiblings } from "./policy-siblings";
import { PolicySummary } from "./policy-summary";

/** One guide or official text; pass `version` to show an archived one. */
export function PolicyPage({
  slug,
  version,
}: {
  slug: PolicySlug;
  version?: string;
}) {
  const { locale, href } = useLocale();
  const c = helpCopy[locale];
  const doc = policyDocument(slug);
  if (!doc) return null;

  const current = currentPolicyVersion(doc);
  const shown = (version && policyVersion(doc, version)) || current;
  const archived = shown.id !== current.id;
  const numbered = doc.kind === "legal";
  return (
    <div className={`policy-page is-${doc.kind}`}>
      {archived ? (
        <aside className="policy-archived" role="note">
          <History size={18} strokeWidth={1.6} aria-hidden="true" />
          <p>
            {c.archivedNotice}{" "}
            <span>
              {c.archivedCurrent.replace(
                "{date}",
                formatPolicyDate(current.id, locale),
              )}
            </span>
          </p>
          <Link href={href(policyPath(doc.slug))}>{c.seeCurrent}</Link>
        </aside>
      ) : null}

      <header className="policy-opening">
        <h1>{doc.title[locale]}</h1>
        <p className="policy-lede">{doc.summary[locale]}</p>
        <p className="policy-meta">
          <span>
            {archived ? c.version : c.updated}{" "}
            <time dateTime={shown.id}>
              {formatPolicyDate(shown.id, locale)}
            </time>
          </span>
          {doc.versions.length > 1 || archived ? (
            <a href="#history">{c.history}</a>
          ) : null}
        </p>
      </header>

      <PolicySummary points={shown.points} />

      <div className="policy-body">
        <aside className="policy-rail">
          <PolicyContents sections={shown.sections} numbered={numbered} />
        </aside>
        <div className="policy-main">
          <PolicyArticle sections={shown.sections} numbered={numbered} />
          <PolicyHistory doc={doc} viewing={shown.id} />
        </div>
      </div>

      <div className="policy-closing">
        <HelpContact />
        <div>
          <PolicySiblings current={doc.slug} />
          <LegalTexts exclude={doc.slug} />
        </div>
      </div>
    </div>
  );
}
