"use client";

import { Eyebrow, PageSection } from "@/components/ui/section";
import { useLocale } from "@/components/i18n";

export function StorySection() {
  const { t } = useLocale();
  return (
    <PageSection id="story" className="human-story">
      <span className="big-number">{t("editionMark")}</span>
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
    <PageSection className="provenance bg-rad-paper">
      <header className="section-heading mb-12">
        <div>
          <Eyebrow>{t("provenanceEyebrow")}</Eyebrow>
          <h2 className="m-0 max-w-xl text-h2 font-normal">
            {t("provenanceTitle")}
          </h2>
        </div>
      </header>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
    <PageSection className="process bg-rad-canvas">
      <header className="section-heading">
        <div>
          <Eyebrow>{t("processEyebrow")}</Eyebrow>
          <h2 className="m-0 text-h2 font-normal">{t("processTitle")}</h2>
        </div>
      </header>
      <div className="steps">
        {steps.map(([index, title, body]) => (
          <article key={index}>
            <span>{index}</span>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>
    </PageSection>
  );
}
