"use client";

import type {MakingCommission} from "@/components/making/type";
import { copy, situationFor } from "@/lib/making";
import { useLocale } from "@/components/i18n";

export function SituationBanner({ commission }: { commission: MakingCommission }) {
  const { locale } = useLocale();
  const situation = situationFor(commission);
  return (
    <aside className="making-situation" aria-live="polite">
      <span className="eyebrow">{copy(situation.stageLabel, locale)}</span>
      <h2>{copy(situation.headline, locale)}</h2>
      <p>{copy(situation.body, locale)}</p>
      <dl>
        <div>
          <dt>{locale === "fa" ? "چه کسی بعد عمل می‌کند؟" : "Who acts next?"}</dt>
          <dd>{copy(situation.actorLabel, locale)}</dd>
        </div>
        <div>
          <dt>{locale === "fa" ? "بعد از آن چه می‌شود؟" : "What happens after?"}</dt>
          <dd>{copy(situation.nextLabel, locale)}</dd>
        </div>
      </dl>
    </aside>
  );
}
