"use client";

import { useId } from "react";
import Image from "next/image";
import { useLocale } from "@/components/i18n";
import { ButtonLink } from "@/components/ui/button-link";
import { journeyCopy, journeyMedia, letterStrokes } from "./const";
import "./journey-about.css";

export function JourneyAbout() {
  const { locale } = useLocale();
  const copy = journeyCopy[locale];
  const maskId = `journey-letter-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const ink = letterStrokes.map((stroke) => <path key={stroke.centre} d={stroke.fill} />);

  return (
    <article className="journey-band journey-about" aria-labelledby="journey-about-title">
      <span className="journey-about-photo" aria-hidden="true">
        <Image src={journeyMedia.about} alt="" fill sizes="100vw" />
      </span>
      <div className="journey-card journey-about-card">
        <span className="journey-paper is-card" aria-hidden="true" />
        <h2 id="journey-about-title">{copy.aboutTitle}</h2>
        <p>{copy.aboutStatement}</p>
        <ButtonLink href="/about">{copy.aboutLink}</ButtonLink>
      </div>
      <div className="journey-letter" data-thread-letter-host aria-hidden="true">
        <span className="journey-letter-entry" data-thread-anchor />
        <svg viewBox="260 60 350 590" focusable="false">
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse" x="240" y="40" width="390" height="630">
              {letterStrokes.map((stroke) => (
                <path
                  key={stroke.centre}
                  className="journey-letter-pen"
                  data-thread-letter
                  pathLength={1}
                  d={stroke.centre}
                />
              ))}
            </mask>
          </defs>
          <g mask={`url(#${maskId})`}>
            <g className="journey-letter-shade">{ink}</g>
            <g className="journey-letter-ink">{ink}</g>
          </g>
        </svg>
      </div>
    </article>
  );
}
