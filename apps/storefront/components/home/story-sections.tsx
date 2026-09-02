"use client";

import { Eyebrow, PageSection } from "@/components/ui/section";
import { useLocale } from "@/components/i18n";

export function StorySection() {
  const { t } = useLocale();
  return (
    <PageSection
      id="story"
      className="grid items-center gap-[clamp(2rem,6vw,6rem)] bg-rad-paper md:grid-cols-[minmax(110px,0.35fr)_1.65fr]"
    >
      <span className="text-display font-normal leading-none text-rad-clay">
        {t("editionMark")}
      </span>
      <div>
        <Eyebrow>{t("philosophy")}</Eyebrow>
        <h2 className="m-0 text-h2 font-normal">{t("storyLead")}</h2>
        <p className="mt-6 max-w-3xl text-prose">{t("storyBodyLong")}</p>
      </div>
    </PageSection>
  );
}

export function ProvenanceSection() {
  const { t } = useLocale();
  const items = [
    [t("provenanceMadeTitle"), t("provenanceMadeBody")],
    [t("provenanceHandTitle"), t("provenanceHandBody")],
    [t("provenanceNumberTitle"), t("provenanceNumberBody")],
  ];
  return (
    <PageSection className="bg-rad-paper">
      <header className="mb-12">
        <Eyebrow>{t("provenanceEyebrow")}</Eyebrow>
        <h2 className="m-0 max-w-xl text-h2 font-normal">
          {t("provenanceTitle")}
        </h2>
      </header>
      <div className="grid gap-8 md:grid-cols-3">
        {items.map(([title, body]) => (
          <article key={title}>
            <b className="block text-lg font-medium">{title}</b>
            <p className="mt-3 text-prose text-rad-muted">{body}</p>
          </article>
        ))}
      </div>
    </PageSection>
  );
}

export function ProcessSection() {
  const { t } = useLocale();
  const steps = [
    [t("processStep1"), t("step1Title"), t("step1Body")],
    [t("processStep2"), t("step2Title"), t("step2Body")],
    [t("processStep3"), t("step3Title"), t("step3Body")],
    [t("processStep4"), t("step4Title"), t("step4Body")],
  ];
  return (
    <PageSection className="bg-rad-canvas">
      <header className="mb-14">
        <Eyebrow>{t("processEyebrow")}</Eyebrow>
        <h2 className="m-0 text-h2 font-normal">{t("processTitle")}</h2>
      </header>
      <div className="grid gap-4 md:grid-cols-4">
        {steps.map(([index, title, body]) => (
          <article key={index} className="min-h-[220px] bg-rad-paper p-6">
            <span className="inline-flex h-10 min-w-16 items-center justify-center rounded-full bg-rad-paper px-3 text-label text-rad-clay [direction:ltr]">
              {index}
            </span>
            <h3 className="mb-2 mt-5 text-h3 font-normal">{title}</h3>
            <p className="m-0 text-prose text-rad-muted">{body}</p>
          </article>
        ))}
      </div>
    </PageSection>
  );
}
