"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import { useLocale } from "@/components/i18n";
import { ButtonLink } from "@/components/ui/button-link";
import { journeyCopy, journeyMedia } from "./const";
import { JourneySpark } from "./journey-spark";
import "./journey-custom.css";

/**
 * Custom order: a rounded photograph with a torn card at the reading end and
 * the order steps on a paper bar along its foot. The thread runs under the
 * bar at the first step, and the steps are selected one by one as the pen
 * passes their marks, each a little further down the page.
 */
export function JourneyCustom() {
  const { locale, t, number } = useLocale();
  const copy = journeyCopy[locale];

  return (
    <article className="journey-custom" aria-labelledby="journey-custom-title">
      <div className="journey-custom-photo">
        <Image
          src={journeyMedia.custom}
          alt={copy.customPhotoAlt}
          fill
          sizes="(max-width: 899px) 94vw, 76rem"
        />
        <JourneySpark className="journey-custom-spark" />
      </div>
      <div className="journey-custom-card">
        <h2 id="journey-custom-title">{t("createPathTitle")}</h2>
        <p>
          {copy.customLine.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>
        <ButtonLink href="/studio">{t("startDesign")}</ButtonLink>
      </div>
      <ol className="journey-custom-steps" aria-label={copy.customStepsLabel}>
        {copy.customSteps.map((step, index) => (
          <li key={step} style={{ "--step": index } as CSSProperties}>
            <span
              className="journey-custom-step-number"
              data-thread-anchor={index === 0 ? "" : undefined}
              aria-hidden="true"
            >
              {number(index + 1)}
            </span>
            {step}
            <span className="journey-custom-step-mark" data-thread-mark aria-hidden="true" />
          </li>
        ))}
      </ol>
    </article>
  );
}
