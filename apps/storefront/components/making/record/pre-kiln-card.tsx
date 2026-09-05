"use client";

import type {MakingCommission} from "@/components/making/type";
import { copy } from "@/lib/making";
import { useLocale } from "@/components/i18n";

export function PreKilnCard({ commission }: { commission: MakingCommission }) {
  const { locale } = useLocale();
  if (!commission.preKiln) return null;
  const item = commission.preKiln;
  return (
    <article className="making-kiln">
      <span className="eyebrow">{locale === "fa" ? "ایستگاه پیش از کوره" : "Pre-kiln checkpoint"}</span>
      <p className="making-warning">
        {locale === "fa"
          ? "رنگ دقیقاً همین نخواهد بود. پخت سرامیک بازه می‌سازد، نه تطابق. ورود به کوره برگشت‌ناپذیر است."
          : "It will not be exactly this colour. Firing creates a range, not a match. The kiln step is irreversible."}
      </p>
      <dl>
        <div>
          <dt>{locale === "fa" ? "ابعاد فرم‌گرفته" : "Formed dimensions"}</dt>
          <dd>{copy(item.dimensions, locale)}</dd>
        </div>
        <div>
          <dt>{locale === "fa" ? "لعاب" : "Glaze"}</dt>
          <dd>
            {item.glazeCode} — {copy(item.glazeName, locale)}
          </dd>
        </div>
        <div>
          <dt>{locale === "fa" ? "بازه رنگ مورد انتظار" : "Expected colour range"}</dt>
          <dd>{copy(item.colorRange, locale)}</dd>
        </div>
        <div>
          <dt>{locale === "fa" ? "کاشی آزمایشی" : "Test tile"}</dt>
          <dd>{copy(item.testTileNote, locale)}</dd>
        </div>
      </dl>
    </article>
  );
}
