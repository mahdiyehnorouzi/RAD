"use client";

import Image from "next/image";
import { useLocale } from "@/components/i18n";
import { nowCopy, nowMedia } from "../const";
import type { LivePiece } from "../type";

export function LiveStages({ piece }: { piece: LivePiece }) {
  const { locale, t, number } = useLocale();
  const c = nowCopy[locale];

  return (
    <section className="live-stages" aria-labelledby="live-stages-title">
      <h2 id="live-stages-title" className="live-sr">
        {c.stagesTitle}
      </h2>
      <ol>
        {piece.milestones.map((milestone, index) => {
          const state = milestone.current ? "current" : milestone.done ? "done" : "next";
          return (
            <li
              key={milestone.id}
              className="live-stage"
              data-state={state}
              aria-current={milestone.current ? "step" : undefined}
            >
              <span className="live-stage-num" aria-hidden="true">
                {number(index + 1)}.
              </span>
              <div className="live-stage-copy">
                <h3>
                  {milestone.title[locale]}
                  {state === "next" ? <small>{c.upcoming}</small> : null}
                </h3>
                {state === "done" ? <span className="live-sr">{c.done}</span> : null}
                <p>{milestone.summary[locale]}</p>
                {milestone.current ? (
                  <p className="live-stage-now">
                    <span>{c.hereNow}</span>
                    {t("liveDaysAgo", { days: number(piece.startedDaysAgo) })}
                  </p>
                ) : null}
                {milestone.note ? (
                  <p className="live-stage-note">{milestone.note[locale]}</p>
                ) : null}
              </div>
              {milestone.media ? (
                <div className="live-stage-media">
                  <Image
                    src={milestone.media}
                    {...nowMedia.stage}
                    alt=""
                    sizes="(min-width: 960px) 26rem, 46vw"
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
