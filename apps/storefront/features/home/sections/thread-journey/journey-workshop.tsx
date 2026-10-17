"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { LivePiece } from "@/components/now/type";
import { useLocale } from "@/components/i18n";
import { journeyCopy, journeyMedia } from "./const";
import { JourneySpark } from "./journey-spark";
import styles from "./journey-workshop.module.css";

/**
 * Today in the workshop: one scene photo, shown at its own natural aspect
 * ratio (never cropped by object-fit, so its baked-in torn paper and blank
 * panel always land at the same fixed percentages) with real HTML text laid
 * directly over the panel - no CSS paper, border or tear recreates what the
 * photo already paints. The thread just passes through on its way to Ready
 * Works.
 *
 * `piece` only decides the CTA's destination: the live `in_workshop`
 * product's own /now/[code] page when one exists, otherwise the /now
 * journal index. The scene photo itself is the approved static reference
 * image, not the live piece's listing photo - this is a teaser into the
 * workshop, not a claim about which exact piece is on the bench today.
 */
export function JourneyWorkshop({
  piece,
}: {
  piece?: Pick<LivePiece, "code" | "image"> | null;
}) {
  const { locale, t, href } = useLocale();
  const copy = journeyCopy[locale];
  const Arrow = locale === "fa" ? ArrowLeft : ArrowRight;
  const linkHref = piece?.code ? href(`/now/${piece.code}`) : href("/now");

  return (
    <article
      className={styles.journeyWorkshop}
      aria-labelledby="journey-workshop-title"
    >
      <Image
        src={journeyMedia.workshopScene}
        alt=""
        width={1448}
        height={1086}
        sizes="(max-width: 899px) 100vw, 76rem"
        className={styles.journeyWorkshopScene}
      />
      <div className={styles.journeyWorkshopSheet}>
        <h2 id="journey-workshop-title">{t("todayWorkshop")}</h2>
        <p>{copy.workshopLine}</p>
        <Link href={linkHref} className={styles.journeyWorkshopLink}>
          {copy.workshopLink}
          <Arrow aria-hidden="true" />
        </Link>
      </div>
      <JourneySpark className={styles.journeyWorkshopSpark} />
      {/* The thread just passes through here on its way to Ready Works - no decorative dot. */}
      <span
        className={styles.journeyWorkshopExit}
        data-thread-anchor
        aria-hidden="true"
      />
    </article>
  );
}
