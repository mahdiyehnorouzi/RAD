"use client";

import { useId } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLocale } from "@/components/i18n";
import { journeyCopy, letterStrokes } from "./const";
import styles from "./journey-about.module.css";

/**
 * What RAD is: the thread comes down past the works and writes رَد in brown
 * ink, with the statement and a link to the story beneath it. It lifts off
 * while writing and picks up again under the link, on to the certificate.
 */
export function JourneyAbout() {
  const { locale, href } = useLocale();
  const copy = journeyCopy[locale];
  const Arrow = locale === "fa" ? ArrowLeft : ArrowRight;
  const maskId = `journey-letter-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const ink = letterStrokes.map((stroke) => (
    <path key={stroke.centre} d={stroke.fill} />
  ));

  return (
    <section
      className={styles.journeyAbout}
      aria-labelledby="journey-about-title"
    >
      <h2 id="journey-about-title" className="sr-only">
        {copy.aboutLabel}
      </h2>
      <div
        className={styles.journeyLetter}
        data-thread-letter-host
        aria-hidden="true"
      >
        <span
          className={styles.journeyLetterEntry}
          data-thread-anchor
          data-thread-hide="start"
        />
        <svg viewBox="260 60 350 590" focusable="false">
          <defs>
            <mask
              id={maskId}
              maskUnits="userSpaceOnUse"
              x="240"
              y="40"
              width="390"
              height="630"
            >
              {letterStrokes.map((stroke) => (
                <path
                  key={stroke.centre}
                  className={styles.journeyLetterPen}
                  data-thread-letter
                  pathLength={1}
                  d={stroke.centre}
                />
              ))}
            </mask>
          </defs>
          <g mask={`url(#${maskId})`}>
            <g className={styles.journeyLetterShade}>{ink}</g>
            <g className={styles.journeyLetterInk}>{ink}</g>
          </g>
        </svg>
      </div>
      <p className={styles.journeyAboutStatement}>{copy.aboutStatement}</p>
      <Link href={href("/about")} className={styles.journeyAboutLink}>
        {copy.aboutLink}
        <Arrow aria-hidden="true" />
      </Link>
      <span
        className={styles.journeyAboutExit}
        data-thread-anchor
        data-thread-hide="end"
        aria-hidden="true"
      />
    </section>
  );
}
