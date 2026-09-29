"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { LivePiece } from "@/components/now/type";
import { useLocale } from "@/components/i18n";
import { journeyCopy } from "./const";
import { JourneySpark } from "./journey-spark";
import "./journey-workshop.css";

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
      className="journey-workshop"
      aria-labelledby="journey-workshop-title"
    >
      <div className="journey-workshop-sheet">
        <h2 id="journey-workshop-title">{t("todayWorkshop")}</h2>
        <p>{copy.workshopLine}</p>
        <Link
          href={href(`/now/${piece.code}`)}
          className="journey-workshop-link"
        >
          {copy.workshopLink}
          <Arrow aria-hidden="true" />
        </Link>
      </div>
      <div className="journey-workshop-photo">
        {piece.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={piece.image} alt="" />
        ) : null}
        <JourneySpark className="journey-workshop-spark" />
        <span
          className="journey-workshop-exit"
          data-thread-anchor
          aria-hidden="true"
        />
      </div>
    </article>
  );
}
