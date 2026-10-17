"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { LivePiece } from "@/components/now/type";
import { useLocale } from "@/components/i18n";
import { journeyCopy, journeyMedia } from "./const";
import { JourneySpark } from "./journey-spark";
import styles from "./journey-workshop.module.css";

/**
 * Today in the workshop: a torn paper sheet beside a torn photograph of the
 * work on the bench. The thread comes out from under the photograph's foot.
 *
 * `piece` is the live `in_workshop` product, when one exists. This section
 * always renders — when nothing is currently live, it falls back to a real
 * bench photo from an actual making journal (never a sold/available
 * product's listing photo, and never a reused photo from another section)
 * and its CTA goes to the `/now` journal index instead of one piece's page.
 */
export function JourneyWorkshop({
  piece,
}: {
  piece?: Pick<LivePiece, "code" | "image"> | null;
}) {
  const { locale, t, href } = useLocale();
  const copy = journeyCopy[locale];
  const Arrow = locale === "fa" ? ArrowLeft : ArrowRight;
  const image = piece?.image || journeyMedia.workshopFallback;
  const linkHref = piece?.code ? href(`/now/${piece.code}`) : href("/now");

  return (
    <article
      className={styles.journeyWorkshop}
      aria-labelledby="journey-workshop-title"
    >
      <div className={styles.journeyWorkshopSheet}>
        <h2 id="journey-workshop-title">{t("todayWorkshop")}</h2>
        <p>{copy.workshopLine}</p>
        <Link href={linkHref} className={styles.journeyWorkshopLink}>
          {copy.workshopLink}
          <Arrow aria-hidden="true" />
        </Link>
      </div>
      <div className={styles.journeyWorkshopPhoto}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" loading="lazy" decoding="async" />
        <JourneySpark className={styles.journeyWorkshopSpark} />
        {/*
         * A permanent waypoint knot, not the scroll-synced pen bead (which
         * only shows mid-draw and disappears once the page is fully drawn
         * past it) - without this, "a dot in the bowl" would only be true at
         * one specific scroll position. The thread itself keeps drawing on
         * through to Ready Works and beyond as the page scrolls; this marks
         * a waypoint on that continuous line, it does not cut the line.
         */}
        <span
          className={styles.journeyWorkshopExit}
          data-thread-anchor
          data-thread-knot
          aria-hidden="true"
        />
      </div>
    </article>
  );
}
