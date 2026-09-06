"use client";

import { StageMeter as SharedStageMeter } from "@rad/ui";
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
  const nextLabel = progress.next ? copy(STAGE_LABEL[progress.next], locale) : undefined;

  return (
    <SharedStageMeter
      index={progress.index}
      total={progress.total}
      label={currentLabel}
      countLabel={t("stageOf", {
        current: number(progress.index + 1),
        total: number(progress.total),
      })}
      kicker={t("currentStage")}
      nextKicker={t("nextStageLabel")}
      nextLabel={compact ? nextLabel : undefined}
      compact={compact}
    />
  );
}
