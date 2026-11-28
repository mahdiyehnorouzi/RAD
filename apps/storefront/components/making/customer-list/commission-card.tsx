"use client";

import Link from "next/link";
import type { MakingCommission } from "@/components/making/type";
import { copy, situationFor } from "@/lib/making";
import { useLocale } from "@/components/i18n";
import { useCommerce } from "@/components/commerce";
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
  const { notices } = useCommerce();
  const unread = notices.filter(
    (notice) =>
      !notice.read &&
      notice.kind === "commission_message" &&
      notice.productSlug === commission.id,
  ).length;
  return (
    <article className="making-card">
      <header>
        <span className="eyebrow">{commission.id}</span>
        <h2>{copy(commission.title, locale)}</h2>
        <p className="order-type-label">{t("customOrderType")}</p>
        {unread > 0 && (
          <p className="order-type-label" role="status">
            {t("unreadCount", { count: String(unread) })}
          </p>
        )}
      </header>
      <StageMeter commission={commission} compact />
      <p>{copy(situation.actorLabel, locale)}</p>
      <Link
        className="button outline"
        href={href(`${hrefBase}/${commission.id}`)}
      >
        {t("makingPathTitle")}
      </Link>
    </article>
  );
}
