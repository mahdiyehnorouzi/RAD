"use client";

import type { Ref } from "react";
import type { Artwork } from "@rad/types";
import { useLocale } from "@/components/i18n";
import type { RadPassport } from "@/components/passport/type";
import { fill, quizCopy } from "../const";
import { ResultCard } from "./result-card";

export function QuizResult({
  matches,
  headingRef,
  onRestart,
}: {
  matches: Array<{ passport: RadPassport; artwork: Artwork | undefined }>;
  headingRef: Ref<HTMLHeadingElement>;
  onRestart: () => void;
}) {
  const { locale, number } = useLocale();
  const c = quizCopy[locale];

  return (
    <section className="sq-result" aria-labelledby="sq-result-title">
      <header className="sq-result-head">
        <span className="sq-done">
          {c.done}
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M4 15 13 4M9 20l11-7" />
          </svg>
        </span>
        <h1 id="sq-result-title" ref={headingRef} tabIndex={-1}>
          {c.resultTitle}
        </h1>
        <p>{fill(c.resultLede, { count: number(matches.length) })}</p>
      </header>

      <ol className="sq-cards">
        {matches.map(({ passport, artwork }, order) => (
          <ResultCard key={passport.code} passport={passport} artwork={artwork} order={order} />
        ))}
      </ol>

      <div className="sq-restart">
        <button type="button" className="sq-again" onClick={onRestart}>
          {c.again}
        </button>
      </div>
    </section>
  );
}
