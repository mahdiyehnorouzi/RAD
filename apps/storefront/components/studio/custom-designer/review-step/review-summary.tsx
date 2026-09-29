"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { useLocale } from "@/components/i18n";
import { StudioIcon, type StudioIconName } from "../../studio-icon";
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
} from "../const";
import type { Designer } from "../hooks";

export function ReviewSummary({ designer }: { designer: Designer }) {
  const { locale } = useLocale();
  const c = designerCopy[locale];
  const prompt = designer.prompt.trim();
  const idea = prompt
    ? prompt.length > 60
      ? `${prompt.slice(0, 60)}…`
      : prompt
    : designer.uploads.length
      ? c.ideaFromPhoto
      : designer.sketch
        ? c.ideaFromSketch
        : designer.hasVoice
          ? c.ideaFromVoice
          : "";
  const form = FORM_OPTIONS.find((option) => option.id === designer.form);
  const size = SIZE_OPTIONS.find((option) => option.id === designer.size);
  const time =
    designer.timeline === DATED_TIMELINE && designer.needBy.trim()
      ? designer.needBy.trim()
      : optionLabel(TIMELINE_OPTIONS, designer.timeline, locale);
  const reference = designer.sketch || designer.uploads[0];

  const rows: Array<{ label: string; icon: StudioIconName; value: ReactNode }> = [
    { label: c.summaryIdea, icon: "sparkles", value: idea },
    { label: c.summaryForm, icon: "image", value: form?.label[locale] },
    { label: c.summarySize, icon: "ruler", value: size?.label[locale] },
    {
      label: c.summaryColors,
      icon: "palette",
      value:
        designer.colors.length || designer.colorNote.trim() ? (
          <span className="review-swatches">
            {designer.colors.map((color) => (
              <i
                key={color}
                role="img"
                aria-label={colorLabel(color, locale)}
                title={colorLabel(color, locale)}
                style={{ background: color }}
              />
            ))}
            {designer.colorNote.trim() ? <span>{designer.colorNote.trim()}</span> : null}
          </span>
        ) : null,
    },
    { label: c.summaryFidelity, icon: "edit", value: c[fidelityKey(designer.freedom)] },
    {
      label: c.summaryBudget,
      icon: "document",
      value: optionLabel(BUDGET_OPTIONS, designer.budget, locale),
    },
    { label: c.summaryTime, icon: "calendar", value: time },
  ];

  return (
    <section className="review-summary" aria-labelledby="review-summary-title">
      <div className="review-summary-main">
        <header>
          <h4 id="review-summary-title">{c.summaryTitle}</h4>
          <button type="button" className="review-edit" onClick={() => designer.goTo("idea")}>
            <StudioIcon name="edit" size={15} />
            <span>{c.summaryEdit}</span>
          </button>
        </header>
        <dl>
          {rows.map((row) => (
            <div key={row.label}>
              <dt>
                <StudioIcon name={row.icon} size={18} />
                <span>{row.label}</span>
              </dt>
              <dd>{row.value || c.summaryNone}</dd>
            </div>
          ))}
        </dl>
      </div>
      <figure className="review-summary-art" aria-hidden="true">
        {reference ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={reference} alt="" />
        ) : form ? (
          <Image src={form.image} alt="" fill sizes="10rem" className="is-cutout" />
        ) : null}
      </figure>
    </section>
  );
}
