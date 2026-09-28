"use client";

import { useLocale } from "@/components/i18n";
import {
  BUDGET_OPTIONS,
  DATED_TIMELINE,
  FORM_OPTIONS,
  SIZE_OPTIONS,
  TIMELINE_OPTIONS,
  colorLabel,
  designerCopy,
  fidelityKey,
  optionLabel,
} from "./const";
import type { Designer } from "./hooks";
import "./idea-card.css";

export function IdeaCard({ designer }: { designer: Designer }) {
  const { t, locale, number } = useLocale();
  const c = designerCopy[locale];
  const separator = locale === "fa" ? "، " : ", ";
  const { uploads, sketch, hasVoice, prompt, forms, colors, reachedIndex } = designer;
  const references = [
    uploads.length ? t("ideaCardHasPhoto") : "",
    sketch ? t("ideaCardHasSketch") : "",
    hasVoice ? t("ideaCardHasVoice") : "",
    prompt.trim() ? t("ideaCardHasWriting") : "",
  ].filter(Boolean);
  const form = forms.map((id) => optionLabel(FORM_OPTIONS, id, locale)).join(separator);
  const sawDetails = reachedIndex >= 2;
  const size = sawDetails ? SIZE_OPTIONS[designer.sizeIndex]?.label[locale] : "";
  const budget = optionLabel(BUDGET_OPTIONS, designer.budget, locale);
  const time =
    designer.timeline === DATED_TIMELINE && designer.needBy.trim()
      ? designer.needBy.trim()
      : optionLabel(TIMELINE_OPTIONS, designer.timeline, locale);
  const padded = number(designer.ideaNumber).padStart(3, locale === "fa" ? "۰" : "0");
  const empty = !form && !colors.length && !references.length && !budget && !time;

  return (
    <article className="idea-card">
      <span>
        {t("ideaCardLabel")} / {padded}
      </span>
      {empty ? (
        <p>{t("ideaCardEmpty")}</p>
      ) : (
        <dl>
          {references.length ? (
            <div>
              <dt>{t("ideaCardReference")}</dt>
              <dd>{references.join(separator)}</dd>
            </div>
          ) : null}
          {form ? (
            <div>
              <dt>{c.cardForm}</dt>
              <dd>{form}</dd>
            </div>
          ) : null}
          {size ? (
            <div>
              <dt>{c.cardSize}</dt>
              <dd>{size}</dd>
            </div>
          ) : null}
          {colors.length ? (
            <div>
              <dt>{t("ideaCardColors")}</dt>
              <dd className="idea-card-swatches">
                {colors.map((color) => (
                  <i
                    key={color}
                    role="img"
                    aria-label={colorLabel(color, locale)}
                    title={colorLabel(color, locale)}
                    style={{ background: color }}
                  />
                ))}
              </dd>
            </div>
          ) : null}
          {sawDetails ? (
            <div>
              <dt>{c.cardFidelity}</dt>
              <dd>{c[fidelityKey(designer.freedom)]}</dd>
            </div>
          ) : null}
          {budget ? (
            <div>
              <dt>{c.cardBudget}</dt>
              <dd>{budget}</dd>
            </div>
          ) : null}
          {time ? (
            <div>
              <dt>{c.cardTime}</dt>
              <dd>{time}</dd>
            </div>
          ) : null}
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
