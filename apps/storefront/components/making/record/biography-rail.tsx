"use client";
import "./biography-rail.css";

import type { MakingCommission } from "@/components/making/type";
import { STAGE_LABEL, copy, stageProgress } from "@/lib/making";
import { useLocale } from "@/components/i18n";

export function BiographyRail({ commission }: { commission: MakingCommission }) {
  const { locale, t, number } = useLocale();
  const progress = stageProgress(commission);

  return (
    <nav className="making-rail-wrap" aria-label={t("currentStage")}>
      <ol className="making-rail">
        {progress.stages.map((stage, index) => {
          const done = index < progress.index || commission.stage === "complete";
          const active = commission.stage === stage;
          return (
            <li
              key={stage}
              className={active ? "active" : done ? "done" : "upcoming"}
              aria-current={active ? "step" : undefined}
            >
              <i>{number(index + 1)}</i>
              <span>
                {copy(STAGE_LABEL[stage], locale)}
                {active ? <b>{t("youAreHere")}</b> : null}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
