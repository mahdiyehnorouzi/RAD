"use client";

import type {MakingCommission} from "@/components/making/type";
import { copy, STAGE_LABEL } from "@/lib/making";
import { formatWhen } from "@/lib/making";
import { useLocale } from "@/components/i18n";

export function StageMessages({
  commission,
  revealInternal = false,
  internalOnly = false,
}: {
  commission: MakingCommission;
  revealInternal?: boolean;
  internalOnly?: boolean;
}) {
  const { locale } = useLocale();
  const items = (
    internalOnly
      ? commission.internalNotes
      : [...commission.messages, ...(revealInternal ? commission.internalNotes : [])]
  ).sort((a, b) => a.createdAt - b.createdAt);
  if (!items.length) {
    return (
      <p className="making-empty">
        {locale === "fa"
          ? "هنوز پیامی به این مسیر وصل نشده است."
          : "No messages are attached to this biography yet."}
      </p>
    );
  }
  return (
    <ol className="making-messages">
      {items.map((item) => (
        <li key={item.id} className={item.internal ? "internal" : item.author}>
          <header>
            <b>
              {item.internal
                ? locale === "fa"
                  ? "یادداشت داخلی"
                  : "Internal note"
                : item.author === "artist"
                  ? commission.artistName
                  : commission.customerName}
            </b>
            <span>{copy(STAGE_LABEL[item.stageId], locale)}</span>
            <time>{formatWhen(item.createdAt, locale)}</time>
          </header>
          <p>{copy(item.body, locale)}</p>
        </li>
      ))}
    </ol>
  );
}
