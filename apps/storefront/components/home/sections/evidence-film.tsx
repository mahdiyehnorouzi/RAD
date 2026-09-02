"use client";

import { Eyebrow } from "@/components/ui/section";
import { useLocale } from "@/components/i18n";

export function EvidenceFilm() {
  const { t } = useLocale();
  return (
    <section className="grid w-full items-center gap-[clamp(2rem,6vw,7rem)] bg-rad-film px-page py-[clamp(3rem,6vw,6rem)] text-rad-paper md:grid-cols-[minmax(240px,0.42fr)_minmax(0,1.58fr)]">
      <div className="py-4">
        <Eyebrow className="text-rad-sand">{t("evidenceEyebrow")}</Eyebrow>
        <h2 className="mb-5 mt-3 max-w-[7ch] text-h2 font-normal text-rad-paper">
          {t("evidenceTitle")}
        </h2>
        <p className="max-w-[30ch] text-prose text-rad-paper/70">
          {t("evidenceBody")}
        </p>
      </div>
      <figure className="relative m-0 overflow-hidden bg-rad-moss after:pointer-events-none after:absolute after:inset-0 after:shadow-[inset_0_0_0_1px_rgba(247,242,233,.12)]">
        <img
          className="block aspect-video h-full w-full object-cover"
          src="/studio-process.svg"
          alt={t("evidenceFilmAlt")}
        />
        <figcaption className="absolute inset-x-5 bottom-[1.15rem] z-[2] text-caption tracking-[0.12em] text-rad-paper">
          {t("evidenceCaption")}
        </figcaption>
      </figure>
    </section>
  );
}
