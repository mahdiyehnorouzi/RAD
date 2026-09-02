"use client";

import type {MakingCommission} from "@/components/making/type";
import { copy } from "@/lib/making";
import { useLocale } from "@/components/i18n";

export function ChangeCards({ commission }: { commission: MakingCommission }) {
  const { locale } = useLocale();
  if (!commission.changeRequests.length) return null;
  return (
    <div className="making-changes">
      {commission.changeRequests.map((item) => (
        <article key={item.id}>
          <span className="eyebrow">
            {item.status === "open"
              ? locale === "fa"
                ? "تغییر باز"
                : "Open change"
              : item.status === "accepted"
                ? locale === "fa"
                  ? "پذیرفته‌شده"
                  : "Accepted"
                : locale === "fa"
                  ? "بسته"
                  : "Closed"}
          </span>
          <dl>
            <div>
              <dt>{locale === "fa" ? "چه چیزی عوض می‌شود" : "What changes"}</dt>
              <dd>{copy(item.whatChanged, locale)}</dd>
            </div>
            <div>
              <dt>{locale === "fa" ? "چرا لازم است" : "Why it is necessary"}</dt>
              <dd>{copy(item.whyNecessary, locale)}</dd>
            </div>
            <div>
              <dt>{locale === "fa" ? "اثر بر قیمت" : "Price effect"}</dt>
              <dd>{copy(item.priceImpact, locale)}</dd>
            </div>
            <div>
              <dt>{locale === "fa" ? "اثر بر زمان" : "Delivery effect"}</dt>
              <dd>{copy(item.timeImpact, locale)}</dd>
            </div>
            {item.alternative ? (
              <div>
                <dt>{locale === "fa" ? "بدیل" : "Alternative"}</dt>
                <dd>{copy(item.alternative, locale)}</dd>
              </div>
            ) : null}
          </dl>
        </article>
      ))}
    </div>
  );
}
