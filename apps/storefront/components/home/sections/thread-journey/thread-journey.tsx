"use client";

import { useRef, type ReactNode } from "react";
import { useLocale } from "@/components/i18n";
import { journeyCopy } from "./const";
import { JourneyAbout } from "./journey-about";
import { JourneyCustom } from "./journey-custom";
import { JourneyHands } from "./journey-hands";
import { JourneyReady } from "./journey-ready";
import { JourneyWorkshop } from "./journey-workshop";
import { RedThread } from "./red-thread";
import { useRedThread } from "./hooks";
import "./thread-journey.css";

/**
 * The home paths after the hero, strung on one red thread that is drawn as the
 * page scrolls and ends by writing رَد. `children` is the hero the thread hangs
 * from; its anchors join the same line.
 */
export function ThreadJourney({ children }: { children?: ReactNode }) {
  const { locale } = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const { svgRef, geometry } = useRedThread(ref);

  return (
    <div ref={ref} className="thread-home">
      {children}
      <section className="journey" aria-label={journeyCopy[locale].aria}>
        <JourneyReady />
        <JourneyCustom />
        <JourneyWorkshop />
        <JourneyHands />
        <JourneyAbout />
      </section>
      <RedThread ref={svgRef} geometry={geometry} />
    </div>
  );
}
