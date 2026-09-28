"use client";

import { Fragment } from "react";
import Image from "next/image";
import { useLocale } from "@/components/i18n";
import { journeyCopy, journeyMedia } from "./const";
import "./journey-hands.css";

export function JourneyHands() {
  const { locale } = useLocale();
  const copy = journeyCopy[locale];

  return (
    <figure className="journey-band journey-hands">
      <Image src={journeyMedia.hands} alt={copy.handsAlt} fill sizes="100vw" />
      <figcaption data-thread-mark>
        {copy.handsNote.map((word, index) => (
          <Fragment key={word}>
            {index > 0 ? (
              <svg viewBox="0 0 40 6" aria-hidden="true" focusable="false">
                <path d="M2 3.4 C10 2.2 18 4.2 26 3 S35 2.6 38 3.2" />
              </svg>
            ) : null}
            <span>{word}</span>
          </Fragment>
        ))}
      </figcaption>
      <span className="journey-ring" data-thread-anchor aria-hidden="true" />
    </figure>
  );
}
