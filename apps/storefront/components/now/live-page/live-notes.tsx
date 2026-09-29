"use client";

import Image from "next/image";
import { useLocale } from "@/components/i18n";
import type { LivePiece } from "../type";

export function LiveNotes({ piece }: { piece: LivePiece }) {
  const { locale, t } = useLocale();
  if (!piece.notes.length) return null;

  return (
    <section className="live-notes" aria-labelledby="live-notes-title">
      <h2 id="live-notes-title">{t("liveNotes")}</h2>
      <ul>
        {piece.notes.map((note) => (
          <li key={note.body.en}>
            <div className="live-note-copy">
              <small>{note.at[locale]}</small>
              <p>{note.body[locale]}</p>
            </div>
            {note.media ? (
              <div className="live-note-media">
                <Image src={note.media} alt="" fill sizes="6.5rem" />
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
