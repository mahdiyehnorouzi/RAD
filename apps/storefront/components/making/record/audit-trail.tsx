"use client";

import type {MakingCommission} from "@/components/making/type";
import { copy, STAGE_LABEL } from "@/lib/making";
import { formatWhen } from "@/lib/making";
import { useLocale } from "@/components/i18n";

export function AuditTrail({ commission }: { commission: MakingCommission }) {
  const { locale } = useLocale();
  return (
    <ol className="making-audit">
      {[...commission.audit].reverse().map((item) => (
        <li key={item.id}>
          <time>{formatWhen(item.at, locale)}</time>
          <b>{copy(item.action, locale)}</b>
          <span>
            {item.actor === "artist"
              ? commission.artistName
              : item.actor === "customer"
                ? commission.customerName
                : locale === "fa"
                  ? "سیستم"
                  : "System"}
            {" · "}
            {copy(STAGE_LABEL[item.stageId], locale)}
          </span>
        </li>
      ))}
    </ol>
  );
}
