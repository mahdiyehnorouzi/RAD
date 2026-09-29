"use client";

import { useLocale } from "@/components/i18n";
import { StudioIcon } from "../studio-icon";
import { DESIGNER_STEP_LABEL, DESIGNER_STEPS, designerCopy, type DesignerStep } from "./const";

export function DesignerNav({
  step,
  reachedIndex,
  onSelect,
}: {
  step: DesignerStep;
  reachedIndex: number;
  onSelect: (step: DesignerStep) => void;
}) {
  const { locale, number } = useLocale();
  const currentIndex = DESIGNER_STEPS.indexOf(step);

  return (
    <nav className="cd-stepper" aria-label={designerCopy[locale].stepsLabel}>
      <ol>
        {DESIGNER_STEPS.map((id, index) => {
          const current = id === step;
          const done = index < currentIndex;
          const state = current ? "is-current" : done ? "is-done" : "";
          return (
            <li key={id} className={state}>
              <button
                type="button"
                disabled={index > reachedIndex}
                aria-current={current ? "step" : undefined}
                onClick={() => onSelect(id)}
              >
                <i aria-hidden="true">{done ? <StudioIcon name="check" size={11} /> : null}</i>
                <span>
                  <span className="sr-only">{number(index + 1)} </span>
                  {DESIGNER_STEP_LABEL[id][locale]}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
