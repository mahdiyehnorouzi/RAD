"use client";

import Image from "next/image";
import { useLocale } from "@/components/i18n";
import { ButtonLink } from "@/components/ui/button-link";
import { journeyCopy, journeyMedia } from "./const";
import "./journey-custom.css";

const stepIndexKeys = ["homeProcessIndex1", "homeProcessIndex2", "homeProcessIndex3"] as const;

export function JourneyCustom() {
  const { locale, t } = useLocale();
  const copy = journeyCopy[locale];

  return (
    <article className="journey-band journey-custom">
      <span className="journey-paper" aria-hidden="true" />
      <figure className="journey-custom-photo">
        <Image src={journeyMedia.custom} alt={copy.customPhotoAlt} fill sizes="(max-width: 900px) 42vw, 50vw" />
      </figure>
      <div className="journey-custom-sheet">
        <span className="journey-paper is-start-torn" aria-hidden="true" />
        <ol className="journey-steps" aria-label={copy.customStepsLabel}>
          {copy.customSteps.map((step, index) => (
            <li key={step}>
              <span className="journey-step-text">
                <span className="journey-step-index">{t(stepIndexKeys[index])}</span>
                <span className="journey-step-name">{step}</span>
              </span>
              <span className="journey-step-dot" data-thread-mark aria-hidden="true" />
            </li>
          ))}
        </ol>
        <div className="journey-custom-card-wrap">
          <div className="journey-card journey-custom-card">
            <span className="journey-paper is-card" aria-hidden="true" />
            <h2>{t("createPathTitle")}</h2>
            <p>
              {copy.customLine.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </p>
            <ButtonLink href="/studio">{t("startDesign")}</ButtonLink>
          </div>
          <span className="journey-pin" data-thread-anchor aria-hidden="true" />
          <span className="journey-point journey-custom-exit" data-thread-anchor aria-hidden="true" />
        </div>
      </div>
    </article>
  );
}
