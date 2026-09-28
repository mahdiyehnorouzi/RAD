"use client";

import { Mouse } from "lucide-react";
import { differenceStages } from "@/components/difference/const";
import { useLocale } from "@/components/i18n";
import { ButtonLink } from "@/components/ui/button-link";

export function StoryCard({
  active,
  copy,
  portraitId,
}: {
  active: number;
  copy: (index: number) => string | undefined;
  portraitId: string;
}) {
  const { locale, t } = useLocale();
  const isLast = active === differenceStages.length - 1;

  return (
    <div className="story-card">
      <span className="story-paper" aria-hidden="true" />
      {/* Every stage is laid in the same cell so the card keeps the height of its longest note. */}
      <div className="story-card-stages" aria-live="polite">
        {differenceStages.map((item, index) => (
          <div
            key={item.id}
            className={`story-card-stage${index === active ? " is-active" : ""}`}
            aria-hidden={index !== active}
          >
            <span className="story-tag">
              {item.index[locale]}
              <span className="story-tag-rule" aria-hidden="true">
                /
              </span>
              {item.label[locale]}
            </span>
            <h3>{item.title[locale]}</h3>
            <p>{copy(index)}</p>
          </div>
        ))}
      </div>
      <div className="story-actions">
        <ButtonLink href={`/differences/${portraitId}`} outline>
          {t("differenceOpen")}
        </ButtonLink>
        <ButtonLink href="/differences" outline>
          {t("museumTitle")}
        </ButtonLink>
      </div>
      <p className={`story-hint${isLast ? " is-spent" : ""}`} aria-hidden="true">
        <Mouse className="story-hint-mouse" strokeWidth={1.4} />
        {t("homeDifferenceScroll")}
      </p>
    </div>
  );
}
