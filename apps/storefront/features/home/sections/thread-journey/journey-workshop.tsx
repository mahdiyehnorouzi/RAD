"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { LivePiece } from "@/components/now/type";
import { useLocale } from "@/components/i18n";
import { journeyCopy } from "./const";
import { JourneySpark } from "./journey-spark";
import styles from "./journey-workshop.module.css";

/**
 * Today in the workshop: a torn paper sheet beside a torn photograph of the
 * work on the bench. The thread comes out from under the photograph's foot.
 */
export function JourneyWorkshop({
  piece,
}: {
  piece?: Pick<LivePiece, "code" | "image">;
}) {
  const { locale, t, href } = useLocale();
  if (!piece) return null;

  const copy = journeyCopy[locale];
  const Arrow = locale === "fa" ? ArrowLeft : ArrowRight;

  return (
    <article
      className={styles.journeyWorkshop}
      aria-labelledby="journey-workshop-title"
    >
      <div className={styles.journeyWorkshopSheet}>
        <h2 id="journey-workshop-title">{t("todayWorkshop")}</h2>
        <p>{copy.workshopLine}</p>
        <Link
          href={href(`/now/${piece.code}`)}
          className={styles.journeyWorkshopLink}
        >
          {copy.workshopLink}
          <Arrow aria-hidden="true" />
        </Link>
      </div>
      <div className={styles.journeyWorkshopPhoto}>
        {piece.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={piece.image} alt="" loading="lazy" decoding="async" />
        ) : null}
        <JourneySpark className={styles.journeyWorkshopSpark} />
        <span
          className={styles.journeyWorkshopExit}
          data-thread-anchor
          aria-hidden="true"
        />
      </div>
    </article>
  );
}
