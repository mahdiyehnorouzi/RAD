"use client";

import { Scale } from "lucide-react";
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

export function PolicyArticle({
  sections,
  numbered,
}: {
  sections: PolicySection[];
  numbered: boolean;
}) {
  const { locale, number } = useLocale();
  const c = helpCopy[locale];

  return (
    <div className="policy-article">
      {sections.map((section, index) => (
        <section
          key={section.id}
          id={section.id}
          className="policy-section"
          aria-labelledby={`${section.id}-title`}
        >
          <h2 id={`${section.id}-title`}>
            {numbered ? (
              <span className="policy-section-index">{number(index + 1)}.</span>
            ) : null}
            {section.title[locale]}
          </h2>
          {section.underReview ? (
            <p className="policy-review">
              <Scale size={16} strokeWidth={1.6} aria-hidden="true" />
              <span>
                <strong>{c.underReview}</strong> {section.underReview[locale]}
              </span>
            </p>
          ) : null}
          {section.blocks.map((block, blockIndex) => (
            <PolicyBlockView key={blockIndex} block={block} />
          ))}
        </section>
      ))}
    </div>
  );
}
