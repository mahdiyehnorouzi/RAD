"use client";
import "./biography-rail.css";

import type { MakingCommission, MakingStageId } from "@/components/making/type";
import { BIOGRAPHY_STAGES, STAGE_LABEL, copy, stageIndex } from "@/lib/making";
import { useLocale } from "@/components/i18n";

export function BiographyRail({ commission }: { commission: MakingCommission }) {
  const { locale, number } = useLocale();
  const current = stageIndex(commission.stage);
  const stages =
    commission.stage === "declined"
      ? (["design_submitted", "feasibility", "declined"] as MakingStageId[])
      : BIOGRAPHY_STAGES;
  return (
    <ol className="making-rail" aria-label={locale === "fa" ? "زندگی‌نامه ساخت" : "Making biography"}>
      {stages.map((stage, index) => {
        const done =
          commission.stage === "declined"
            ? stage !== "declined"
            : current > index || commission.stage === "complete";
        const active = commission.stage === stage;
        return (
          <li
            key={stage}
            className={active ? "active" : done ? "done" : ""}
            aria-current={active ? "step" : undefined}
          >
            <i>{number(index + 1)}</i>
            <span>{copy(STAGE_LABEL[stage], locale)}</span>
          </li>
        );
      })}
    </ol>
  );
}
