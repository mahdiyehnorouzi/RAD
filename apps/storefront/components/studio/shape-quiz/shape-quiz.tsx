"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/i18n";
import { formatPassportName, radPassports, traitDistance } from "@/lib/passport";
import type { PassportTraits } from "@/components/passport/type";
import { SHAPE_QUESTIONS } from "./const";
import "./shape-quiz.css";

const empty: PassportTraits = {
  crooked: 0.5,
  quiet: 0.5,
  worn: 0.5,
  surprise: 0.5,
  strange: 0.5,
};

export function ShapeQuiz() {
  const { locale, t, number, href } = useLocale();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const done = answers.length === SHAPE_QUESTIONS.length;
  const traits = useMemo(() => {
    const next = { ...empty };
    SHAPE_QUESTIONS.forEach((question, index) => {
      const value = answers[index];
      if (value === undefined) return;
      next[question.trait] = value;
    });
    return next;
  }, [answers]);
  const matches = done
    ? radPassports
        .filter((item) => item.traits)
        .map((item) => ({ item, distance: traitDistance(traits, item.traits) }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3)
        .map((entry) => entry.item)
    : [];
  const question = SHAPE_QUESTIONS[step];

  return (
    <section className="shape-quiz">
      <header>
        <span className="eyebrow">{t("shapeEyebrow")}</span>
        <h1>{t("shapeTitle")}</h1>
        <p>{t("shapeBody")}</p>
      </header>

      {!done && question ? (
        <div className="shape-question">
          <small>
            {t("stageOf", {
              current: number(step + 1),
              total: number(SHAPE_QUESTIONS.length),
            })}
          </small>
          <h2>{question.prompt[locale]}</h2>
          <div>
            {question.choices.map((choice) => (
              <button
                key={choice.label.en}
                type="button"
                className="button outline"
                onClick={() => {
                  setAnswers((current) => [...current.slice(0, step), choice.value]);
                  setStep((current) => current + 1);
                }}
              >
                {choice.label[locale]}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="shape-result">
          <p>{t("shapeResult")}</p>
          <ol>
            {matches.map((passport) => (
              <li key={passport.code}>
                <Link href={href(`/passport/${passport.code}`)}>
                  {formatPassportName(passport, locale, number)}
                </Link>
              </li>
            ))}
          </ol>
          <button
            type="button"
            className="button outline"
            onClick={() => {
              setAnswers([]);
              setStep(0);
            }}
          >
            {t("shapeAgain")}
          </button>
        </div>
      )}
    </section>
  );
}
