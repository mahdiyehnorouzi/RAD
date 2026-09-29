"use client";
import "./policy-page.css";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, History } from "lucide-react";
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
import { useOpenSections } from "./hooks";
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
  const doc = policyDocument(slug);
  if (!doc) return null;
  return <PolicyDocumentView slug={slug} version={version} />;
}

function PolicyDocumentView({
  slug,
  version,
}: {
  slug: PolicySlug;
  version?: string;
}) {
  const { locale, href } = useLocale();
  const c = helpCopy[locale];
  const doc = policyDocument(slug)!;
  const current = currentPolicyVersion(doc);
  const shown = (version && policyVersion(doc, version)) || current;
  const archived = shown.id !== current.id;
  const numbered = doc.kind === "legal";
  const ids = useMemo(
    () => shown.sections.map((section) => section.id),
    [shown],
  );
  const { open, setSection, setAll, allOpen } = useOpenSections(ids);

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
        <div className="policy-opening-media" aria-hidden="true">
          <Image
            src="/help/policy-stone.webp"
            alt=""
            width={560}
            height={640}
            sizes="(min-width: 960px) 26rem, 48vw"
            loading="eager"
            fetchPriority="high"
          />
        </div>
        <div className="policy-opening-copy">
          <h1>{doc.title[locale]}</h1>
          <p className="policy-lede">{doc.summary[locale]}</p>
          <p className="policy-meta">
            <span className="policy-meta-date">
              <CalendarDays size={16} strokeWidth={1.6} aria-hidden="true" />
              <span>
                {archived ? `${c.version} ` : `${c.updated}: `}
                <time dateTime={shown.id}>
                  {formatPolicyDate(shown.id, locale)}
                </time>
              </span>
            </span>
            {doc.versions.length > 1 || archived ? (
              <a href="#history">{c.history}</a>
            ) : null}
          </p>
        </div>
      </header>

      <div className="policy-body">
        <PolicySummary points={shown.points} />
        <aside className="policy-rail">
          <PolicyContents
            sections={shown.sections}
            numbered={numbered}
            allOpen={allOpen}
            onReveal={(id) => setSection(id, true)}
            onToggleAll={() => setAll(!allOpen)}
          />
        </aside>
        <div className="policy-main">
          <PolicyArticle
            sections={shown.sections}
            numbered={numbered}
            open={open}
            onToggle={setSection}
          />
          <PolicyHistory doc={doc} viewing={shown.id} />
        </div>
      </div>

      <div className="policy-closing">
        <HelpContact variant="bar" />
        <div className="policy-more">
          <PolicySiblings current={doc.slug} />
          <LegalTexts exclude={doc.slug} />
        </div>
      </div>
    </div>
  );
}
