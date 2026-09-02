"use client";

import { Eyebrow } from "@/components/ui/section";
import { useLocale } from "@/components/i18n";

export function EvidenceFilm() {
  const { t } = useLocale();
  return (
    <section className="evidence-film">
      <div className="film-copy">
        <Eyebrow className="text-rad-sand">{t("evidenceEyebrow")}</Eyebrow>
        <h2 className="mb-5 mt-3 max-w-[7ch] text-h2 font-normal text-rad-paper">
          {t("evidenceTitle")}
        </h2>
        <p className="max-w-[30ch] text-prose text-rad-paper/70">
          {t("evidenceBody")}
        </p>
      </div>
      <figure className="film-frame">
        <img
          className="studio-film"
          src="/studio-process.svg"
          alt={t("evidenceFilmAlt")}
        />
        <figcaption>{t("evidenceCaption")}</figcaption>
      </figure>
    </section>
  );
}
