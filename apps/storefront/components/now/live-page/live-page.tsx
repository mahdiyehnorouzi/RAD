"use client";

import Link from "next/link";
import { useLocale } from "@/components/i18n";
import { formatPassportCode } from "@/lib/passport";
import type { LivePiece } from "../type";
import "./live-page.css";

export function LivePage({ piece }: { piece: LivePiece }) {
  const { locale, t, number, href } = useLocale();
  const code = formatPassportCode(piece.code, locale, number);
  const current = piece.milestones.find((item) => item.current);

  return (
    <article className="live-page">
      <header>
        <span className="eyebrow">{t("liveEyebrow")}</span>
        <h1>{t("liveHeadline", { code })}</h1>
        <p>
          {piece.name[locale]} · {piece.maker[locale]}
        </p>
        <p className="live-now">
          {t("liveNow")}: {current?.title[locale]}
          <span>
            {t("liveDaysAgo", { days: number(piece.startedDaysAgo) })}
          </span>
        </p>
      </header>

      <ol className="live-rail">
        {piece.milestones.map((milestone, index) => (
          <li
            key={milestone.id}
            className={milestone.current ? "is-current" : milestone.done ? "is-done" : ""}
          >
            <b>
              {number(index + 1)}
              {milestone.done ? " ✓" : milestone.current ? " …" : ""}
            </b>
            <strong>{milestone.title[locale]}</strong>
            {milestone.note ? <p>{milestone.note[locale]}</p> : null}
            {milestone.media ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={milestone.media} alt="" />
            ) : null}
          </li>
        ))}
      </ol>

      <section className="live-notes">
        <h2>{t("liveNotes")}</h2>
        <ul>
          {piece.notes.map((note) => (
            <li key={note.body.en}>
              <small>{note.at[locale]}</small>
              <p>{note.body[locale]}</p>
              {note.media ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={note.media} alt="" />
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <Link href={href("/archive")} className="button outline">
        {t("archiveBack")}
      </Link>
    </article>
  );
}
