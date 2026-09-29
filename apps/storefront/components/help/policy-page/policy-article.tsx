"use client";

import { ChevronDown, Scale } from "lucide-react";
import { useLocale } from "@/components/i18n";
import { helpCopy } from "../const";
import type { PolicyBlock, PolicySection } from "../type";

function PolicyBlockView({ block }: { block: PolicyBlock }) {
  const { locale } = useLocale();

  switch (block.kind) {
    case "p":
      return <p>{block.text[locale]}</p>;
    case "note":
      return <p className="policy-note">{block.text[locale]}</p>;
    case "list":
      return (
        <ul>
          {block.items.map((item) => (
            <li key={item.en}>{item[locale]}</li>
          ))}
        </ul>
      );
    case "steps":
      return (
        <ol className="policy-steps">
          {block.items.map((item) => (
            <li key={item.en}>{item[locale]}</li>
          ))}
        </ol>
      );
  }
}

/** Each clause folds; find-in-page and `#section` links unfold it. */
export function PolicyArticle({
  sections,
  numbered,
  open,
  onToggle,
}: {
  sections: PolicySection[];
  numbered: boolean;
  open: ReadonlySet<string>;
  onToggle: (id: string, open: boolean) => void;
}) {
  const { locale, number } = useLocale();
  const c = helpCopy[locale];

  return (
    <div className="policy-article">
      {sections.map((section, index) => (
        <details
          key={section.id}
          id={section.id}
          className="policy-section"
          open={open.has(section.id)}
          onToggle={(event) => onToggle(section.id, event.currentTarget.open)}
        >
          <summary>
            <h2 id={`${section.id}-title`}>
              {numbered ? (
                <span className="policy-section-index">
                  {number(index + 1)}.
                </span>
              ) : null}
              {section.title[locale]}
            </h2>
            <ChevronDown
              className="policy-section-chevron"
              size={20}
              strokeWidth={1.6}
              aria-hidden="true"
            />
          </summary>
          <div className="policy-section-body">
            {section.underReview ? (
              <p className="policy-review">
                <Scale size={16} strokeWidth={1.6} aria-hidden="true" />
                <span>
                  <strong>{c.underReview}</strong>{" "}
                  {section.underReview[locale]}
                </span>
              </p>
            ) : null}
            {section.blocks.map((block, blockIndex) => (
              <PolicyBlockView key={blockIndex} block={block} />
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
