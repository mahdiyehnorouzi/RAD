"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/i18n";
import { fill, quizCopy } from "./const";
import { useShapeMatches, useShapeQuestions } from "./hooks";
import { QuizFoot } from "./quiz-foot";
import { QuizQuestion } from "./quiz-question";
import { QuizResult } from "./quiz-result";
import { QuizStatus } from "./quiz-status";
import { QuizSteps } from "./quiz-steps";
import styles from "./shape-quiz.module.css";

export function ShapeQuiz() {
  const { locale, number } = useLocale();
  const c = quizCopy[locale];
  const { questions, status, retry } = useShapeQuestions();
  const [step, setStep] = useState(0);
  const [way, setWay] = useState<"forward" | "back">("forward");
  const [answers, setAnswers] = useState<Array<number | undefined>>([]);
  const [done, setDone] = useState(false);
  const matches = useShapeMatches(questions, answers, done);
  const total = questions.length;
  const question = questions[step];
  const playable = status === "ready" && total > 0;
  const reached = Math.min(
    answers.filter((value) => value !== undefined).length,
    total - 1,
  );

  const layoutRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  useEffect(() => {
    if (!moved.current) return;
    headingRef.current?.focus({ preventScroll: true });
    const anchor = done ? layoutRef.current : sheetRef.current;
    if (anchor && anchor.getBoundingClientRect().top < 0) {
      const still = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      anchor.scrollIntoView({
        block: "start",
        behavior: still ? "auto" : "smooth",
      });
    }
  }, [step, done]);

  const goTo = (next: number) => {
    moved.current = true;
    setWay(next < step ? "back" : "forward");
    setStep(next);
  };

  const pick = (value: number) =>
    setAnswers((current) => {
      const next = [...current];
      next[step] = value;
      return next;
    });

  const advance = () => {
    if (answers[step] === undefined) return;
    if (step < total - 1) goTo(step + 1);
    else {
      moved.current = true;
      setDone(true);
    }
  };

  const restart = () => {
    moved.current = true;
    setAnswers([]);
    setWay("forward");
    setStep(0);
    setDone(false);
  };

  return (
    <div className={styles.shapeQuiz}>
      <div
        ref={layoutRef}
        className={styles.sqLayout}
        data-quiz={done ? "result" : "ask"}
      >
        {done ? (
          <QuizResult
            matches={matches}
            headingRef={headingRef}
            onRestart={restart}
          />
        ) : (
          <>
            <header className={styles.sqHead}>
              <h1>{c.title}</h1>
              {playable ? (
                <>
                  <p>{fill(c.lede, { count: number(total) })}</p>
                  <QuizSteps
                    total={total}
                    current={step}
                    reached={reached}
                    onSelect={goTo}
                  />
                </>
              ) : null}
            </header>
            <div ref={sheetRef} className={styles.sqSheet}>
              {!playable ? (
                <QuizStatus status={status} onRetry={retry} />
              ) : question ? (
                <QuizQuestion
                  key={step}
                  question={question}
                  index={step}
                  total={total}
                  way={way}
                  picked={answers[step]}
                  headingRef={headingRef}
                  onPick={pick}
                  onNext={advance}
                  onBack={() => goTo(step - 1)}
                />
              ) : null}
            </div>
          </>
        )}
      </div>
      <QuizFoot />
    </div>
  );
}
