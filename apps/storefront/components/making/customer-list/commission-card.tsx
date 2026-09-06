"use client";

import Link from "next/link";
import type { MakingCommission } from "@/components/making/type";
import { copy, situationFor } from "@/lib/making";
import { useLocale } from "@/components/i18n";
import { StageMeter } from "../record";

export function CommissionCard({
  commission,
  hrefBase,
}: {
  commission: MakingCommission;
  hrefBase: string;
}) {
  const { locale, href, t } = useLocale();
  const situation = situationFor(commission);
  return (
    <article className="making-card">
      <header>
        <span className="eyebrow">{commission.id}</span>
        <h2>{copy(commission.title, locale)}</h2>
      </header>
      <StageMeter commission={commission} compact />
      <p>{copy(situation.actorLabel, locale)}</p>
      <Link className="button outline" href={href(`${hrefBase}/${commission.id}`)}>
        {t("makingNav")}
      </Link>
    </article>
  );
}
