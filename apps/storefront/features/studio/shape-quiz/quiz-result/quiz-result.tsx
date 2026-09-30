"use client";

import type { Ref } from "react";
import type { Artwork } from "@rad/types";
import { useLocale } from "@/components/i18n";
import type { RadPassport } from "@/components/passport/type";
import { fill, quizCopy } from "../const";
import { ResultCard } from "./result-card";
import styles from "./quiz-result.module.css";

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
    <section className={styles.sqResult} aria-labelledby="sq-result-title">
      <header className={styles.sqResultHead}>
        <span className={styles.sqDone}>
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

      <ol className={styles.sqCards}>
        {matches.map(({ passport, artwork }, order) => (
          <ResultCard
            key={passport.code}
            passport={passport}
            artwork={artwork}
            order={order}
          />
        ))}
      </ol>

      <div className={styles.sqRestart}>
        <button type="button" className={styles.sqAgain} onClick={onRestart}>
          {c.again}
        </button>
      </div>
    </section>
  );
}
