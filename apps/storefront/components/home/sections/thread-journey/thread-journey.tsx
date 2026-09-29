"use client";

import { useRef, type ReactNode } from "react";
import type { LivePiece } from "@/components/now/type";
import { useLocale } from "@/components/i18n";
import { journeyCopy } from "./const";
import { JourneyAbout } from "./journey-about";
import { JourneyCustom } from "./journey-custom";
import { JourneyReady } from "./journey-ready";
import { JourneyWorkshop } from "./journey-workshop";
import { RedThread } from "./red-thread";
import { useRedThread } from "./hooks";
import "./thread-journey.css";

/**
 * The home page strung on one red thread, drawn as the page scrolls: from the
 * hero's torn edge through the paths, behind the `works`, on to write رَد,
 * through the `closing` certificate and into the footer's thread. The hero,
 * works and closing join the line by their own anchors.
 */
export function ThreadJourney({
  hero,
  works,
  closing,
  workshop,
}: {
  hero: ReactNode;
  works: ReactNode;
  closing: ReactNode;
  /** Today's piece on the workbench, if any work is being made. */
  workshop?: Pick<LivePiece, "code" | "image">;
}) {
  const { locale } = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const { svgRef, geometry } = useRedThread(ref);

  return (
    <div ref={ref} className="thread-home">
      {hero}
      <section className="journey" aria-label={journeyCopy[locale].aria}>
        <JourneyWorkshop piece={workshop} />
        <JourneyReady />
        <JourneyCustom />
      </section>
      {works}
      <JourneyAbout />
      {closing}
      <RedThread ref={svgRef} geometry={geometry} />
    </div>
  );
}
