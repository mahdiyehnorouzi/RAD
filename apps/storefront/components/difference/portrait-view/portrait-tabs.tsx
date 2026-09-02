"use client";

import { useLocale } from "@/components/i18n";
import { differenceStages } from "../const";
import type { DifferenceStageId } from "../type";

export function PortraitTabs({
  tabId,
  stage,
  onSelect,
}: {
  tabId: string;
  stage: DifferenceStageId;
  onSelect: (id: DifferenceStageId) => void;
}) {
  const { locale, t } = useLocale();
  return (
    <div className="difference-stage-tabs" role="tablist" aria-label={t("differenceTrail")}>
      {differenceStages.map((item) => {
        const selected = item.id === stage;
        return (
          <button
            type="button"
            role="tab"
            id={`${tabId}-${item.id}`}
            key={item.id}
            aria-selected={selected}
            aria-controls={`${tabId}-panel`}
            tabIndex={selected ? 0 : -1}
            className={selected ? "active" : ""}
            onClick={() => onSelect(item.id)}
            onKeyDown={(event) => {
              if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
              event.preventDefault();
              const next = event.key === (locale === "fa" ? "ArrowLeft" : "ArrowRight") ? 1 : -1;
              const current = differenceStages.findIndex((step) => step.id === stage);
              const target =
                differenceStages[
                  (current + next + differenceStages.length) % differenceStages.length
                ];
              onSelect(target.id);
              document.getElementById(`${tabId}-${target.id}`)?.focus();
            }}
          >
            <small>{item.index[locale]}</small>
            <span>{item.title[locale]}</span>
          </button>
        );
      })}
    </div>
  );
}
