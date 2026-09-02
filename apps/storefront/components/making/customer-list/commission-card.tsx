"use client";

import Link from "next/link";
import type {MakingCommission} from "@/components/making/type";
import { copy, situationFor } from "@/lib/making";
import { formatWhen } from "@/lib/making";
import { useLocale } from "@/components/i18n";

export function CommissionCard({
  commission,
  hrefBase,
}: {
  commission: MakingCommission;
  hrefBase: string;
}) {
  const { locale, href } = useLocale();
  const situation = situationFor(commission);
  return (
    <article className="making-card">
      <header>
        <span className="eyebrow">{commission.id}</span>
        <h2>{copy(commission.title, locale)}</h2>
        <b>{copy(situation.headline, locale)}</b>
      </header>
      <p>{copy(situation.body, locale)}</p>
      <small>
        {copy(situation.actorLabel, locale)} · {locale === "fa" ? "تخمین تکمیل" : "Est. completion"}{" "}
        {formatWhen(commission.estimatedCompletion, locale)}
      </small>
      <Link className="button outline" href={href(`${hrefBase}/${commission.id}`)}>
        {locale === "fa" ? "گشودن مسیر ساخت" : "Open making path"}
      </Link>
    </article>
  );
}
