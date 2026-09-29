"use client";
import "./portrait-view.css";

import Link from "next/link";
import { useLocale } from "@/components/i18n";
import { ButtonLink } from "@/components/ui/button-link";
import { usePassports } from "@/hooks/use-artworks";
import { findPassport } from "@/lib/passport";
import { differencePageCopy, differenceStages, surprisePermissions } from "../const";
import { TraceHero, TraceQuote, TraceTimeline } from "../trace";
import type { DifferencePortrait, DifferenceStageId, TraceStep } from "../type";
import { PortraitCertificate } from "./portrait-certificate";

type Locale = "fa" | "en";

function stageNotes(portrait: DifferencePortrait, stage: DifferenceStageId, locale: Locale, permissionLabel: string) {
  const permission = surprisePermissions.find((item) => item.id === portrait.permission);
  switch (stage) {
    case "described":
      return permission
        ? [`${permissionLabel} ${permission.title[locale]}`, permission.body[locale]]
        : [portrait.described[locale]];
    case "imagined":
      return [portrait.imaginedNote[locale]];
    case "artist":
      return portrait.artistNotes.map((note) => note[locale]);
    case "material":
      return portrait.materialNotes.map((note) => note[locale]);
  }
}

export function DifferencePortraitView({
  portrait,
  image,
}: {
  portrait: DifferencePortrait;
  image?: string;
}) {
  const { locale, t, href } = useLocale();
  const c = differencePageCopy[locale];
  const passports = usePassports();
  const passport = findPassport(passports, portrait.id) ?? findPassport(passports, portrait.code);
  const title = portrait.title?.[locale] ?? t("differenceTitle");
  const heroImage = image ?? portrait.stageImages?.material;

  const steps: TraceStep[] = differenceStages.map((stage) => {
    const src = portrait.stageImages?.[stage.id];
    const palette = portrait.palette[stage.id];
    return {
      id: stage.id,
      title: stage.title[locale],
      notes: stageNotes(portrait, stage.id, locale, c.permissionLabel),
      image: src ? { src, alt: `${stage.label[locale]}: ${title}` } : undefined,
      swatch: { ...palette, label: c.portraitNoImage },
    };
  });

  return (
    <article className="trace-world difference-portrait">
      <TraceHero
        titleId="difference-title"
        title={title}
        lede={portrait.described[locale]}
        image={heroImage ? { src: heroImage, alt: title } : undefined}
        swatch={portrait.palette.material}
      >
        <ul className="trace-hero-meta">
          <li>
            <b dir="ltr">{portrait.code}</b>
          </li>
          <li>{portrait.maker[locale]}</li>
        </ul>
      </TraceHero>

      <section className="difference-portrait-journey" aria-labelledby="difference-journey-title">
        <header className="trace-section-head">
          <h2 id="difference-journey-title">{c.portraitJourneyTitle}</h2>
          <p>{c.portraitJourneyLede}</p>
        </header>
        <TraceTimeline steps={steps} labelledBy="difference-journey-title" />
        {passport ? (
          <Link className="difference-portrait-passport" href={href(`/passport/${passport.code}`)}>
            {t("pdpPassportLink")}
          </Link>
        ) : null}
      </section>

      <div className="difference-portrait-end">
        <PortraitCertificate portrait={portrait} />
        <TraceQuote lines={c.quoteLines} />
        <nav className="difference-portrait-actions" aria-label={t("museumTitle")}>
          <ButtonLink href="/differences" className="difference-portrait-back">
            {t("museumBack")}
          </ButtonLink>
          <ButtonLink href="/studio" outline>
            {t("designMine")}
          </ButtonLink>
        </nav>
      </div>
    </article>
  );
}
