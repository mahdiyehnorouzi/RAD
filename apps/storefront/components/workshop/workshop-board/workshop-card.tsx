"use client";
import "./workshop-card.css";

import Link from "next/link";
import type { MakingCommission } from "@/components/making/type";
import { copy, deadlineWarning, situationFor, STAGE_LABEL } from "@/lib/making";
import { useLocale } from "@/components/i18n";

export function WorkshopCard({ commission }: { commission: MakingCommission }) {
  const { locale, href } = useLocale();
  const situation = situationFor(commission);
  const warning = deadlineWarning(commission);
  return (
    <article className={`workshop-card${warning ? " warn" : ""}`}>
      <header>
        <span>{commission.id}</span>
        {warning ? <b className="deadline">{locale === "fa" ? "مهلت نزدیک" : "Deadline soon"}</b> : null}
      </header>
      <h3>{copy(commission.title, locale)}</h3>
      <p>{copy(situation.headline, locale)}</p>
      <small>
        {commission.customerName} · {copy(STAGE_LABEL[commission.stage], locale)}
      </small>
      <Link className="button outline" href={href(`/workshop/${commission.id}`)}>
        {locale === "fa" ? "گشودن در کارگاه" : "Open in workshop"}
      </Link>
    </article>
  );
}
