"use client";

import { DifferenceTrailStrip } from "@/components/difference-portrait";
import { ButtonLink } from "@/components/ui/button-link";
import { Eyebrow, PageSection } from "@/components/ui/section";
import { useLocale } from "@/components/i18n";
import { museumPortraits } from "@/lib/beautiful-difference";

export function DifferenceStory() {
  const { locale, t } = useLocale();
  const storyPortrait = museumPortraits[0];
  if (!storyPortrait) return null;

  return (
    <PageSection
      className="difference-story grid items-end gap-[clamp(2rem,5vw,5rem)] bg-rad-paper md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
      aria-labelledby="difference-story-title"
    >
      <div>
        <Eyebrow>{t("differenceEyebrow")}</Eyebrow>
        <h2 id="difference-story-title" className="m-0 text-h2 font-normal">
          {t("homeDifferenceTitle")}
        </h2>
        <p className="mt-4 max-w-xl text-prose">{storyPortrait.described[locale]}</p>
        <p className="difference-story-maker mt-3">
          {storyPortrait.maker[locale]} · {storyPortrait.code}
        </p>
      </div>
      <div>
        <DifferenceTrailStrip
          portrait={storyPortrait}
          labelledBy="difference-story-title"
        />
        <div className="difference-story-actions">
          <ButtonLink href={`/differences/${storyPortrait.id}`} outline>
            {t("differenceOpen")}
          </ButtonLink>
          <ButtonLink href="/differences" outline>
            {t("museumTitle")}
          </ButtonLink>
        </div>
      </div>
    </PageSection>
  );
}
