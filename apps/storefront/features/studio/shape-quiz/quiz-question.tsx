"use client";

import type { Ref } from "react";
import Link from "next/link";
import type { ShapeQuestion } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { StudioIcon, readingChevron } from "../studio-icon";
import { fill, quizCopy } from "./const";
import styles from "./quiz-question.module.css";

export function QuizQuestion({
  question,
  index,
  total,
  way,
  picked,
  headingRef,
  onPick,
  onNext,
  onBack,
}: {
  question: ShapeQuestion;
  index: number;
  total: number;
  way: "forward" | "back";
  picked: number | undefined;
  headingRef: Ref<HTMLHeadingElement>;
  onPick: (value: number) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const { locale, number, href } = useLocale();
  const c = quizCopy[locale];
  const last = index === total - 1;
  const name = `shape-${question.trait}`;

  return (
    <div className={styles.sqBody} data-way={way}>
      <fieldset className={styles.sqField}>
        <legend>
          <span className={styles.sqStage}>
            {fill(c.stageOf, {
              current: number(index + 1),
              total: number(total),
            })}
          </span>
          <h2 ref={headingRef} tabIndex={-1}>
            {question.prompt[locale]}
          </h2>
        </legend>
        <p className={styles.sqHint}>{question.hint[locale]}</p>

        <div className={styles.sqChoices}>
          {question.choices.map((choice) => {
            const checked = picked === choice.value;
            return (
              <label
                key={choice.label.en}
                className={`${styles.sqChoice}${checked ? ` ${styles.checked}` : ""}`}
              >
                <input
                  type="radio"
                  name={name}
                  value={choice.value}
                  checked={checked}
                  onChange={() => onPick(choice.value)}
                />
                <span className={styles.sqChoiceCopy}>
                  <span className={styles.sqChoiceTitle}>
                    <span className={styles.sqRadio} aria-hidden="true" />
                    <strong>{choice.label[locale]}</strong>
                  </span>
                  <span className={styles.sqChoiceNote}>
                    {choice.note[locale]}
                  </span>
                </span>
                <span className={styles.sqChoicePhoto}>
                  <img
                    src={choice.photo.src}
                    alt={choice.photo.alt[locale]}
                    width={640}
                    height={640}
                    decoding="async"
                  />
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className={styles.sqActions}>
        {index > 0 ? (
          <button
            type="button"
            className={styles.sqBack}
            onClick={onBack}
            aria-label={c.back}
          >
            <StudioIcon name={readingChevron(locale, "back")} size={20} />
          </button>
        ) : null}
        <button
          type="button"
          className={styles.sqNext}
          disabled={picked === undefined}
          onClick={onNext}
        >
          <span>{last ? c.finish : c.next}</span>
          <StudioIcon name={readingChevron(locale, "forward")} size={20} />
        </button>
      </div>
      {index === 0 ? (
        <Link className={styles.sqHome} href={href("/")}>
          {c.home}
        </Link>
      ) : null}
    </div>
  );
}
