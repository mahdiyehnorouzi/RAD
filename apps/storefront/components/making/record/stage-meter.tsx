"use client";
import "./stage-meter.css";

import type { MakingCommission } from "@/components/making/type";
import { copy, STAGE_LABEL, stageProgress } from "@/lib/making";
import { useLocale } from "@/components/i18n";

export function StageMeter({
  commission,
  compact = false,
}: {
  commission: MakingCommission;
  compact?: boolean;
}) {
  const { locale, t, number } = useLocale();
  const progress = stageProgress(commission);
  const currentLabel = copy(STAGE_LABEL[progress.current], locale);
  const nextLabel = progress.next
    ? copy(STAGE_LABEL[progress.next], locale)
    : null;
  const percent = Math.round(((progress.index + 1) / progress.total) * 100);

  return (
    <div className={`stage-meter${compact ? " compact" : ""}`}>
      <p className="stage-meter-kicker">{t("currentStage")}</p>
      <p className="stage-meter-now">{currentLabel}</p>
      <p className="stage-meter-count">
        {t("stageOf", {
          current: number(progress.index + 1),
          total: number(progress.total),
        })}
      </p>
      <div
        className="stage-meter-bar"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={progress.total}
        aria-valuenow={progress.index + 1}
        aria-label={currentLabel}
      >
        <i style={{ width: `${percent}%` }} />
      </div>
      {compact && nextLabel ? (
        <small>
          {t("nextStageLabel")}: {nextLabel}
        </small>
      ) : null}
    </div>
  );
}
