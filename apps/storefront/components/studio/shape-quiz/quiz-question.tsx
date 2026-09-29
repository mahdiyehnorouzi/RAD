"use client";

import type { Ref } from "react";
import Link from "next/link";
import { useLocale } from "@/components/i18n";
import { StudioIcon, readingChevron } from "../studio-icon";
import { fill, quizCopy, type ShapeQuestion } from "./const";

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
    <div className="sq-body" data-way={way}>
      <fieldset className="sq-field">
        <legend>
          <span className="sq-stage">
            {fill(c.stageOf, { current: number(index + 1), total: number(total) })}
          </span>
          <h2 ref={headingRef} tabIndex={-1}>
            {question.prompt[locale]}
          </h2>
        </legend>
        <p className="sq-hint">{question.hint[locale]}</p>

        <div className="sq-choices">
          {question.choices.map((choice) => {
            const checked = picked === choice.value;
            return (
              <label key={choice.label.en} className={`sq-choice${checked ? " is-checked" : ""}`}>
                <input
                  type="radio"
                  name={name}
                  value={choice.value}
                  checked={checked}
                  onChange={() => onPick(choice.value)}
                />
                <span className="sq-choice-copy">
                  <span className="sq-choice-title">
                    <span className="sq-radio" aria-hidden="true" />
                    <strong>{choice.label[locale]}</strong>
                  </span>
                  <span className="sq-choice-note">{choice.note[locale]}</span>
                </span>
                <span className="sq-choice-photo">
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

      <div className="sq-actions">
        {index > 0 ? (
          <button type="button" className="sq-back" onClick={onBack} aria-label={c.back}>
            <StudioIcon name={readingChevron(locale, "back")} size={20} />
          </button>
        ) : null}
        <button
          type="button"
          className="sq-next"
          disabled={picked === undefined}
          onClick={onNext}
        >
          <span>{last ? c.finish : c.next}</span>
          <StudioIcon name={readingChevron(locale, "forward")} size={20} />
        </button>
      </div>
      {index === 0 ? (
        <Link className="sq-home" href={href("/")}>
          {c.home}
        </Link>
      ) : null}
    </div>
  );
}
