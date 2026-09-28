"use client";

import { useLocale } from "@/components/i18n";
import { helpCopy } from "../const";
import type { PolicySection } from "../type";

export function PolicyContents({
  sections,
  numbered,
}: {
  sections: PolicySection[];
  numbered: boolean;
}) {
  const { locale, number } = useLocale();

  return (
    <nav className="policy-contents" aria-labelledby="policy-contents-title">
      <h2 id="policy-contents-title">{helpCopy[locale].onThisPage}</h2>
      <ol className={numbered ? "is-numbered" : undefined}>
        {sections.map((section, index) => (
          <li key={section.id}>
            <a href={`#${section.id}`}>
              {numbered ? (
                <span className="policy-contents-index" aria-hidden="true">
                  {number(index + 1)}
                </span>
              ) : null}
              {section.title[locale]}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
