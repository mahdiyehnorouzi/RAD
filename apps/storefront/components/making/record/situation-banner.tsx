"use client";
import "./situation-banner.css";

import type { MakingCommission } from "@/components/making/type";
import { copy, situationFor } from "@/lib/making";
import { useLocale } from "@/components/i18n";
import { StageMeter } from "./stage-meter";

export function SituationBanner({ commission }: { commission: MakingCommission }) {
  const { locale, t } = useLocale();
  const situation = situationFor(commission);
  return (
    <aside className="making-situation" aria-live="polite">
      <StageMeter commission={commission} />
      <h2>{copy(situation.headline, locale)}</h2>
      <p>{copy(situation.body, locale)}</p>
      <dl>
        <div>
          <dt>{locale === "fa" ? "چه کسی الان عمل می‌کند؟" : "Who acts now?"}</dt>
          <dd>{copy(situation.actorLabel, locale)}</dd>
        </div>
        <div>
          <dt>{t("nextStageLabel")}</dt>
          <dd>{copy(situation.nextLabel, locale)}</dd>
        </div>
      </dl>
    </aside>
  );
}
