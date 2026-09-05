"use client";
import "./quote-card.css";

import type {MakingCommission} from "@/components/making/type";
import { copy, moneyFor } from "@/lib/making";
import { formatWhen } from "@/lib/making";
import { useLocale } from "@/components/i18n";

export function QuoteCard({
  commission,
  snapshot = false,
}: {
  commission: MakingCommission;
  snapshot?: boolean;
}) {
  const { locale } = useLocale();
  const quote = snapshot ? commission.approvedSnapshot?.quote : commission.quote;
  if (!quote) return null;
  const rows = [
    [locale === "fa" ? "مشخصات نهایی" : "Final specification", copy(quote.specification, locale)],
    [locale === "fa" ? "هنرمند" : "Artist", quote.artistName],
    [locale === "fa" ? "قیمت" : "Price", moneyFor(commission, locale, quote.priceToman, quote.priceUsd)],
    [
      locale === "fa" ? "بیعانه" : "Deposit",
      moneyFor(commission, locale, quote.depositToman, quote.depositUsd),
    ],
    [
      locale === "fa" ? "مانده" : "Remaining balance",
      moneyFor(
        commission,
        locale,
        quote.priceToman - quote.depositToman,
        quote.priceUsd - quote.depositUsd,
      ),
    ],
    [locale === "fa" ? "پنجره تکمیل" : "Completion window", copy(quote.completionWindow, locale)],
    [
      locale === "fa" ? "بازبینی‌های شامل" : "Included revisions",
      String(quote.includedRevisions),
    ],
    [locale === "fa" ? "لغو و استرداد" : "Cancellation and refunds", copy(quote.cancellationRules, locale)],
  ];
  return (
    <article className={`making-quote${snapshot ? " snapshot" : ""}`}>
      <header>
        <span className="eyebrow">
          {snapshot
            ? locale === "fa"
              ? "نسخه تأییدشده"
              : "Approved snapshot"
            : locale === "fa"
              ? "پیشنهاد ساخت"
              : "Making proposal"}
        </span>
        {snapshot && commission.approvedSnapshot ? (
          <time>{formatWhen(commission.approvedSnapshot.approvedAt, locale)}</time>
        ) : null}
      </header>
      <dl>
        {rows.map(([label, value]) => (
          <div key={String(label)}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
