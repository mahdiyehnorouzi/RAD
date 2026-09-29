"use client";

import { ChevronsUpDown, ListOrdered } from "lucide-react";
import { useLocale } from "@/components/i18n";
import { helpCopy } from "../const";
import type { PolicySection } from "../type";

export function PolicyContents({
  sections,
  numbered,
  allOpen,
  onReveal,
  onToggleAll,
}: {
  sections: PolicySection[];
  numbered: boolean;
  allOpen: boolean;
  onReveal: (id: string) => void;
  onToggleAll: () => void;
}) {
  const { locale, number } = useLocale();
  const c = helpCopy[locale];

  return (
    <nav className="policy-contents" aria-labelledby="policy-contents-title">
      <div className="policy-contents-head">
        <h2 id="policy-contents-title" className="policy-card-title">
          <ListOrdered size={20} strokeWidth={1.6} aria-hidden="true" />
          {c.onThisPage}
        </h2>
        <button
          type="button"
          className="policy-contents-toggle"
          onClick={onToggleAll}
        >
          <ChevronsUpDown size={15} strokeWidth={1.6} aria-hidden="true" />
          {allOpen ? c.closeAll : c.openAll}
        </button>
      </div>
      <ol className={numbered ? "is-numbered" : undefined}>
        {sections.map((section, index) => (
          <li key={section.id}>
            <a href={`#${section.id}`} onClick={() => onReveal(section.id)}>
              {numbered ? (
                <span className="policy-contents-index" aria-hidden="true">
                  {number(index + 1)}
                </span>
              ) : null}
              <span>{section.title[locale]}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
