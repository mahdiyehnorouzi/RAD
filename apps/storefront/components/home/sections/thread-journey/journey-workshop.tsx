"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { useLocale } from "@/components/i18n";
import { useLivePieces } from "@/hooks/use-artworks";
import { formatPassportCode } from "@/lib/passport";
import { workshopToday } from "@/lib/now";
import { journeyCopy } from "./const";
import "./journey-workshop.css";

export function JourneyWorkshop() {
  const { locale, t, number, href } = useLocale();
  const piece = workshopToday(useLivePieces());
  if (!piece) return null;

  const copy = journeyCopy[locale];
  const currentIndex = Math.max(0, piece.milestones.findIndex((item) => item.current));
  const current = piece.milestones[currentIndex];
  const code = formatPassportCode(piece.code, locale, number);
  const progress = currentIndex / Math.max(1, piece.milestones.length - 1);

  return (
    <article className="journey-band journey-workshop">
      <span className="journey-paper" aria-hidden="true" />
      <Link href={href(`/now/${piece.code}`)} className="journey-workshop-panel">
        <div className="journey-workshop-copy">
          <h2>{t("todayWorkshop")}</h2>
          <p className="journey-workshop-code">
            {locale === "fa" ? `رَد ${code}` : `RAD ${code}`}
          </p>
          <p className="journey-workshop-stage">
            {t("liveNow")}
            {locale === "fa" ? "، " : ": "}
            <b>{current?.title[locale]}</b>
          </p>
          <p className="journey-workshop-days">
            {t("liveDaysAgo", { days: number(piece.startedDaysAgo) })}
          </p>
        </div>
        {piece.image ? (
          <span className="journey-workshop-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={piece.image} alt="" />
          </span>
        ) : null}
        <ol
          className="journey-rail"
          aria-label={copy.railLabel}
          style={{ "--rail-progress": progress, "--rail-count": piece.milestones.length } as CSSProperties}
        >
          {piece.milestones.map((milestone) => (
            <li
              key={milestone.id}
              data-state={milestone.current ? "current" : milestone.done ? "done" : "next"}
              aria-current={milestone.current ? "step" : undefined}
            >
              <span className="journey-rail-dot" aria-hidden="true" />
              <span className="journey-rail-label">{milestone.title[locale]}</span>
            </li>
          ))}
        </ol>
      </Link>
      <span className="journey-pin journey-workshop-pin" data-thread-anchor aria-hidden="true" />
    </article>
  );
}
