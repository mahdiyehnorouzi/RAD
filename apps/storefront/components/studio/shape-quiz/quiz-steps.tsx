"use client";

import { useLocale } from "@/components/i18n";
import { StudioIcon } from "../studio-icon";
import { fill, quizCopy } from "./const";

export function QuizSteps({
  total,
  current,
  reached,
  onSelect,
}: {
  total: number;
  current: number;
  reached: number;
  onSelect: (index: number) => void;
}) {
  const { locale, number } = useLocale();
  const c = quizCopy[locale];

  return (
    <nav className="sq-steps" aria-label={c.stepsLabel}>
      <ol>
        {Array.from({ length: total }, (_, index) => {
          const done = index < current;
          const state = index === current ? "is-current" : done ? "is-done" : "";
          return (
            <li key={index} className={state}>
              <button
                type="button"
                disabled={index > reached}
                aria-current={index === current ? "step" : undefined}
                aria-label={fill(c.step, { n: number(index + 1) })}
                onClick={() => onSelect(index)}
              >
                {done ? <StudioIcon name="check" size={14} /> : number(index + 1)}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
