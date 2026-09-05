"use client";

import { DifferenceTrailStrip } from "@/components/difference";
import { ButtonLink } from "@/components/ui/button-link";
import { useLocale } from "@/components/i18n";
import { museumPortraits } from "@/lib/difference";
import "./difference-story.css";

export function DifferenceStory() {
  const { locale, t } = useLocale();
  const storyPortrait = museumPortraits[0];
  if (!storyPortrait) return null;

  return (
    <section className="difference-story section" aria-labelledby="difference-story-title">
      <div>
        <span className="eyebrow">{t("differenceEyebrow")}</span>
        <h2 id="difference-story-title">{t("homeDifferenceTitle")}</h2>
        <p>{storyPortrait.described[locale]}</p>
        <p className="difference-story-maker">
          {storyPortrait.maker[locale]} · {storyPortrait.code}
        </p>
      </div>
      <div>
        <DifferenceTrailStrip portrait={storyPortrait} labelledBy="difference-story-title" />
        <div className="difference-story-actions">
          <ButtonLink href={`/differences/${storyPortrait.id}`} outline>
            {t("differenceOpen")}
          </ButtonLink>
          <ButtonLink href="/differences" outline>
            {t("museumTitle")}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
