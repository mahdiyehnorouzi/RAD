"use client";

import { useRef, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useLocale } from "@/components/i18n";
import { CollaborationBand } from "../collaboration-band";
import { journeyCopy } from "./const";
import { JourneyAbout } from "./journey-about";
import { JourneyReady } from "./journey-ready";
import { RedThread } from "./red-thread";
import { useRedThread } from "./hooks";
import styles from "./thread-journey.module.css";

// Below-the-fold, and the only home-page component pulling in the `motion`
// library. Code-split so that library isn't parsed/evaluated as part of the
// initial bundle the hero needs to hydrate — it still renders on the server
// for content/SEO, it just ships in its own chunk.
const JourneyCustom = dynamic(() =>
  import("./journey-custom").then((mod) => mod.JourneyCustom),
);

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
  workshopSlot,
}: {
  hero: ReactNode;
  works: ReactNode;
  closing: ReactNode;
  /** The <JourneyWorkshop> Server Component, rendered and passed down from
   * page.tsx - a Client Component can't import and render a Server
   * Component directly in its own body, only receive one as children/a
   * prop from a true Server Component ancestor (same pattern as
   * hero/works/closing above). */
  workshopSlot: ReactNode;
}) {
  const { locale } = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const { svgRef, geometry } = useRedThread(ref);

  return (
    <div ref={ref} className={styles.threadHome}>
      {hero}
      <section className={styles.journey} aria-label={journeyCopy[locale].aria}>
        {workshopSlot}
        <JourneyReady />
        <JourneyCustom />
      </section>
      {works}
      <CollaborationBand />
      <JourneyAbout />
      {closing}
      <RedThread ref={svgRef} geometry={geometry} />
    </div>
  );
}
