"use client";
import "./differences-page.css";

import Link from "next/link";
import { useLocale } from "@/components/i18n";
import { ButtonLink } from "@/components/ui/button-link";
import { differenceMedia, differencePageCopy } from "../const";
import { TraceHero, TraceQuote, TraceTimeline } from "../trace";
import type { DifferencePortrait, TraceIconName, TraceStep } from "../type";
import { DifferencesCompare } from "./differences-compare";
import { DifferencesMuseum } from "./differences-museum";
import { DifferencesTraces } from "./differences-traces";

const journeyIcons: Record<
  keyof typeof differenceMedia.journey,
  TraceIconName
> = {
  clay: "clay",
  shape: "hand",
  glaze: "brush",
  fire: "kiln",
  rad: "bowl",
};

export function DifferencesPage({
  portraits,
}: {
  portraits: DifferencePortrait[];
}) {
  const { locale, t, href } = useLocale();
  const c = differencePageCopy[locale];
  const journey: TraceStep[] = (
    Object.keys(journeyIcons) as (keyof typeof journeyIcons)[]
  ).map((id) => ({
    id,
    title: c.journey[id].title,
    notes: [c.journey[id].body],
    image: { src: differenceMedia.journey[id], alt: c.journey[id].alt },
    icon: journeyIcons[id],
  }));

  return (
    <div className="trace-world differences-page">
      <TraceHero
        titleId="differences-title"
        title={c.title}
        lede={c.lede}
        image={{ src: differenceMedia.hero.src, alt: c.heroAlt }}
        mirrored
      />

      <DifferencesTraces />

      <section
        className="differences-journey"
        aria-labelledby="differences-journey-title"
      >
        <header className="trace-section-head">
          <h2 id="differences-journey-title">{c.journeyTitle}</h2>
          <p>{c.journeyLede}</p>
        </header>
        <TraceTimeline steps={journey} labelledBy="differences-journey-title" />
      </section>

      <DifferencesCompare />

      <DifferencesMuseum portraits={portraits} />

      <section
        className="differences-close"
        aria-labelledby="differences-close-title"
      >
        <TraceQuote lines={c.quoteLines} />
        <div className="differences-close-copy">
          <h2 id="differences-close-title">{t("impossibleTitle")}</h2>
          <p>{t("impossibleBody")}</p>
          <div className="differences-close-actions">
            <ButtonLink href="/studio">{t("designMine")}</ButtonLink>
            <Link className="differences-text-link" href={href("/products")}>
              {c.worksLink}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
