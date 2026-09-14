"use client";

import { useLocale } from "@/components/i18n";
import { DESIGNER_FEELINGS } from "./const";
import "./idea-card.css";

export function IdeaCard({
  ideaNumber,
  prompt,
  feeling,
  categoryLabel,
  colors,
  uploads,
  sketch,
  hasVoice,
  freedom,
}: {
  ideaNumber: number;
  prompt: string;
  feeling: string;
  categoryLabel: string;
  colors: string[];
  uploads: string[];
  sketch: string;
  hasVoice: boolean;
  freedom: number;
}) {
  const { t, locale, number } = useLocale();
  const mood = DESIGNER_FEELINGS.find((item) => item.id === feeling);
  const references = [
    uploads.length ? t("ideaCardHasPhoto") : "",
    sketch ? t("ideaCardHasSketch") : "",
    hasVoice ? t("ideaCardHasVoice") : "",
    prompt.trim() ? t("ideaCardHasWriting") : "",
  ].filter(Boolean);
  const form =
    freedom > 60
      ? locale === "fa"
        ? `${categoryLabel || "آزاد"}، نامتقارن`
        : `${categoryLabel || "open"}, asymmetric`
      : categoryLabel;
  const padded = number(ideaNumber).padStart(3, locale === "fa" ? "۰" : "0");
  const empty = !mood && !form && !colors.length && !references.length;

  return (
    <article className="idea-card">
      <span>
        {t("ideaCardLabel")} / {padded}
      </span>
      {empty ? (
        <p>{t("ideaCardEmpty")}</p>
      ) : (
        <dl>
          {mood ? (
            <div>
              <dt>{t("ideaCardMood")}</dt>
              <dd>{mood.label[locale]}</dd>
            </div>
          ) : null}
          {form ? (
            <div>
              <dt>{t("ideaCardForm")}</dt>
              <dd>{form}</dd>
            </div>
          ) : null}
          {colors.length ? (
            <div>
              <dt>{t("ideaCardColors")}</dt>
              <dd className="idea-card-swatches">
                {colors.map((color) => (
                  <i key={color} style={{ background: color }} />
                ))}
              </dd>
            </div>
          ) : null}
          {references.length ? (
            <div>
              <dt>{t("ideaCardReference")}</dt>
              <dd>{references.join(locale === "fa" ? "، " : ", ")}</dd>
            </div>
          ) : null}
          <div>
            <dt>{t("ideaCardFreedom")}</dt>
            <dd>{locale === "fa" ? `${number(freedom)}٪` : `${number(freedom)}%`}</dd>
          </div>
        </dl>
      )}
      {sketch || uploads[0] ? (
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={sketch || uploads[0]} alt="" />
          <figcaption>{t("ideaCardReference")}</figcaption>
        </figure>
      ) : null}
      <p className="idea-card-note">{t("ideaCardDisclaimer")}</p>
    </article>
  );
}
