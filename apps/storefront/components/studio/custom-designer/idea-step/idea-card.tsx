"use client";

import { useLocale } from "@/components/i18n";
import { designerCopy } from "../const";
import type { Designer } from "../hooks";
import { IdeaSketch } from "./idea-sketch";

export function IdeaCard({ designer }: { designer: Designer }) {
  const { t, locale, number } = useLocale();
  const c = designerCopy[locale];
  const { uploads, sketch, prompt } = designer;
  const padded = number(designer.ideaNumber).padStart(3, locale === "fa" ? "۰" : "0");
  const text = prompt.trim();
  const excerpt = text.length > 90 ? `${text.slice(0, 90)}…` : text;
  const reference = sketch || uploads[0];

  return (
    <article className="idea-card" aria-live="polite">
      <div className="idea-card-text">
        <span className="idea-card-id">
          {t("ideaCardLabel")} / {padded}
        </span>
        {excerpt ? <p className="idea-card-excerpt">{excerpt}</p> : <p>{c.cardEmpty}</p>}
        <p className="idea-card-note">{c.cardNote}</p>
      </div>
      <figure className={`idea-card-art${reference ? " has-reference" : ""}`}>
        {reference ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={reference} alt="" />
        ) : (
          <span className="idea-card-paper">
            <IdeaSketch />
          </span>
        )}
      </figure>
    </article>
  );
}
