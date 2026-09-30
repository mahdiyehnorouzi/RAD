"use client";

import type { ReactNode } from "react";
import { useLocale } from "@/components/i18n";
import { StudioIcon, readingArrow } from "../../studio-icon";
import { designerCopy } from "../const";
import type { Designer } from "../hooks";
import { ReviewPath } from "./review-path";
import { ReviewRules } from "./review-rules";
import { ReviewSummary } from "./review-summary";
import styles from "./review-step.module.css";
import shell from "../custom-designer.module.css";
import btn from "../../studio-btn.module.css";

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
  const { t, locale, href } = useLocale();
  const c = designerCopy[locale];

  return (
    <div className={shell.cdStep}>
      <header className={shell.cdStepHead}>
        <h3>{c.reviewTitle}</h3>
        <p>{c.reviewHelp}</p>
      </header>

      <ReviewSummary designer={designer} />

      <div className={styles.reviewColumns}>
        <section aria-labelledby="review-notes-title">
          <h4 id="review-notes-title" className="sr-only">
            {c.notesTitle}
          </h4>
          <ReviewRules />
        </section>
        <section aria-labelledby="review-next-title">
          <h4 id="review-next-title">{c.nextTitle}</h4>
          <ReviewPath labelledBy="review-next-title" />
        </section>
      </div>

      <label
        className={`${styles.reviewAgree}${designer.agreed ? ` ${styles.checked}` : ""}`}
      >
        <input
          type="checkbox"
          checked={designer.agreed}
          onChange={(event) => designer.setAgreed(event.target.checked)}
          disabled={submitting}
        />
        <span className={styles.reviewAgreeBox} aria-hidden="true">
          {designer.agreed ? <StudioIcon name="check" size={14} /> : null}
        </span>
        <span>
          {locale === "en" ? "I accept the " : null}
          <a href={href("/help/custom")} target="_blank" rel="noopener">
            {c.agreeLink}
          </a>
          {c.agreeAfter ? ` ${c.agreeAfter}` : "."}
        </span>
      </label>

      {error ? (
        <div className={`${shell.cdError} review-error`} role="alert">
          <p>{error}</p>
          {errorAction}
        </div>
      ) : null}

      <button
        type="button"
        className={`${btn.csBtn} ${btn.csBtnSolid} ${styles.reviewSend}`}
        onClick={onSubmit}
        disabled={!designer.agreed || submitting || offline}
        aria-busy={submitting}
      >
        <span>{submitting ? t("submitting") : c.submit}</span>
        <StudioIcon name={readingArrow(locale, "forward")} size={20} />
      </button>
      <p className={styles.reviewFree}>
        <StudioIcon name="info" size={16} />
        <span>{c.submitNote}</span>
      </p>
    </div>
  );
}
