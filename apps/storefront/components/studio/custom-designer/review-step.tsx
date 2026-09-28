"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useLocale } from "@/components/i18n";
import { OrderPath, OrderRules } from "../order-guide";
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
  type DesignerStep,
} from "./const";
import type { Designer } from "./hooks";

export function ReviewStep({
  designer,
  onSubmit,
  submitting,
  offline,
  error,
  errorAction,
}: {
  designer: Designer;
  onSubmit: () => void;
  submitting: boolean;
  offline: boolean;
  error: string;
  errorAction?: ReactNode;
}) {
  const { t, locale, number, href } = useLocale();
  const c = designerCopy[locale];
  const Arrow = locale === "fa" ? ArrowLeft : ArrowRight;
  const separator = locale === "fa" ? "، " : ", ";
  const attachments = [
    designer.uploads.length
      ? c.attachPhotos.replace("{count}", number(designer.uploads.length))
      : "",
    designer.sketch ? c.attachSketch : "",
    designer.hasVoice ? c.attachVoice : "",
  ].filter(Boolean);
  const prompt = designer.prompt.trim();
  const idea = [
    prompt.length > 90 ? `${prompt.slice(0, 90)}…` : prompt,
    attachments.join(separator),
  ]
    .filter(Boolean)
    .join(" · ");
  const size = SIZE_OPTIONS[designer.sizeIndex];
  const time =
    designer.timeline === DATED_TIMELINE && designer.needBy.trim()
      ? designer.needBy.trim()
      : optionLabel(TIMELINE_OPTIONS, designer.timeline, locale);

  const rows: Array<{ label: string; value: ReactNode; step: DesignerStep }> = [
    { label: c.summaryIdea, value: idea, step: "idea" },
    {
      label: c.summaryForm,
      value: designer.forms.map((id) => optionLabel(FORM_OPTIONS, id, locale)).join(separator),
      step: "form",
    },
    {
      label: c.summarySize,
      value: [size?.label[locale], designer.dimensions.trim()].filter(Boolean).join(" · "),
      step: "details",
    },
    {
      label: c.summaryColors,
      value: designer.colors.length ? (
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
        </span>
      ) : (
        ""
      ),
      step: "details",
    },
    { label: c.summaryFidelity, value: c[fidelityKey(designer.freedom)], step: "details" },
    {
      label: c.summaryBudget,
      value: optionLabel(BUDGET_OPTIONS, designer.budget, locale),
      step: "plan",
    },
    { label: c.summaryTime, value: time, step: "plan" },
  ];

  return (
    <div className="designer-step review-step">
      <header className="designer-step-head">
        <h3>{c.reviewTitle}</h3>
        <p>{c.reviewHelp}</p>
      </header>

      <section className="review-block" aria-labelledby="review-summary-title">
        <h4 id="review-summary-title">{c.summaryTitle}</h4>
        <dl className="review-summary">
          {rows.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value || c.summaryNone}</dd>
              <button
                type="button"
                className="review-edit"
                onClick={() => designer.goTo(row.step)}
                aria-label={`${c.summaryEdit}: ${row.label}`}
              >
                {c.summaryEdit}
              </button>
            </div>
          ))}
        </dl>
      </section>

      <section className="review-block" aria-labelledby="review-next-title">
        <h4 id="review-next-title">{c.nextTitle}</h4>
        <OrderPath compact labelledBy="review-next-title" />
      </section>

      <section className="review-block" aria-labelledby="review-notes-title">
        <h4 id="review-notes-title">{c.notesTitle}</h4>
        <OrderRules briefOnly />
        <p className="review-rules-links">
          <a className="review-rules-link" href="#rules">
            {c.rulesLink}
          </a>
          <a
            className="review-rules-link"
            href={href("/help/custom")}
            target="_blank"
            rel="noopener"
          >
            {c.fullTerms}
          </a>
        </p>
      </section>

      <label className={`review-agree${designer.agreed ? " is-checked" : ""}`}>
        <input
          type="checkbox"
          checked={designer.agreed}
          onChange={(event) => designer.setAgreed(event.target.checked)}
          disabled={submitting}
        />
        <span className="designer-check-box" aria-hidden="true">
          {designer.agreed ? <Check size={14} strokeWidth={2} /> : null}
        </span>
        <span>
          {c.agree}
          <small className="review-agree-note">{c.agreeNote}</small>
        </span>
      </label>

      {error ? (
        <div className="form-error review-error" role="alert">
          <p>{error}</p>
          {errorAction}
        </div>
      ) : null}

      <div className="review-submit">
        <button
          type="button"
          className="button review-send"
          onClick={onSubmit}
          disabled={!designer.agreed || submitting || offline}
          aria-busy={submitting}
        >
          <span>{submitting ? t("submitting") : c.submit}</span>
          <Arrow className="button-arrow" aria-hidden="true" size={18} strokeWidth={1.6} />
        </button>
        <p>{c.submitNote}</p>
        <p className="review-talk-first">
          {c.talkFirst}{" "}
          <Link href={href("/contact?topic=custom#message")}>
            {c.talkFirstLink}
          </Link>
        </p>
      </div>
    </div>
  );
}
