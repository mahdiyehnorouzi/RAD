"use client";

import { DESIGNER_STEP_KEY, DESIGNER_STEPS, type DesignerStep } from "./const";
import { useLocale } from "@/components/i18n";

export function DesignerNav({
  step,
  reachedIndex,
  number,
  onSelect,
}: {
  step: DesignerStep;
  reachedIndex: number;
  number: (value: number) => string;
  onSelect: (step: DesignerStep) => void;
}) {
  const { t } = useLocale();
  const currentIndex = DESIGNER_STEPS.indexOf(step);
  return (
    <div className="designer-nav">
      <p>
        {t("stageOf", {
          current: number(currentIndex + 1),
          total: number(DESIGNER_STEPS.length),
        })}
      </p>
      <ol className="designer-steps" aria-label={t("titleStudio")}>
        {DESIGNER_STEPS.map((id, index) => {
          const current = id === step;
          const reached = index <= reachedIndex;
          return (
            <li key={id} className={current ? "current" : reached ? "done" : ""}>
              <button
                type="button"
                disabled={index > reachedIndex}
                aria-current={current ? "step" : undefined}
                onClick={() => onSelect(id)}
              >
                <i>{number(index + 1)}</i>
                <span>{t(DESIGNER_STEP_KEY[id])}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
