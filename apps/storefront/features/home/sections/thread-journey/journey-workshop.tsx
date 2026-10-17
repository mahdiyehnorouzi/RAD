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
         * The thread ties off here with a permanent knot, not the
         * scroll-synced pen bead (which only shows mid-draw and is gone
         * once the page has fully drawn past it) - without this, "ends in a
         * dot in the bowl" would only be true at one specific scroll
         * position. data-thread-hide="start" then lets the run to the next
         * section's anchor pass invisibly behind the page, instead of
         * visibly crossing the gap toward the Ready Works tag.
         */}
        <span
          className={styles.journeyWorkshopExit}
          data-thread-anchor
          data-thread-knot
          data-thread-hide="start"
          aria-hidden="true"
        />
      </div>
    </article>
  );
}
