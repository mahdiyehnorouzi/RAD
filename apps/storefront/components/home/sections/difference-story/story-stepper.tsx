"use client";

import { differenceStages } from "@/components/difference/const";
import { useLocale } from "@/components/i18n";

export function StoryStepper({
  active,
  onSelect,
}: {
  active: number;
  onSelect: (index: number) => void;
}) {
  const { locale } = useLocale();

  return (
    <ol className="story-stepper">
      {differenceStages.map((item, index) => (
        <li
          key={item.id}
          className={
            index === active ? "is-active" : index < active ? "is-done" : ""
          }
        >
          <button
            type="button"
            onClick={() => onSelect(index)}
            aria-current={index === active ? "step" : undefined}
            aria-label={`${item.index[locale]} — ${item.title[locale]}`}
          >
            <span className="story-stepper-dot" aria-hidden="true" />
            <span className="story-stepper-index" aria-hidden="true">
              {item.index[locale]}
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}
