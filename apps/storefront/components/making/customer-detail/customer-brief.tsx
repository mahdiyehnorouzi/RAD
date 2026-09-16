"use client";

import { useLocale } from "@/components/i18n";
import type { MakingCommission } from "@/components/making/type";

export function CustomerBrief({ commission }: { commission: MakingCommission }) {
  const { locale, t } = useLocale();
  const images = [
    ...(commission.brief.images ?? []),
    ...(commission.brief.image && !(commission.brief.images ?? []).includes(commission.brief.image)
      ? [commission.brief.image]
      : []),
  ];
  const rows = [
    {
      label: locale === "fa" ? "مفهوم" : "Concept",
      value: commission.brief.concept,
    },
    {
      label: locale === "fa" ? "ابعاد" : "Dimensions",
      value: commission.brief.dimensions,
    },
    {
      label: locale === "fa" ? "ماده" : "Material",
      value: commission.brief.material,
    },
    {
      label: locale === "fa" ? "کاربرد" : "Intended use",
      value: commission.brief.intendedUse,
    },
    {
      label: locale === "fa" ? "بودجه" : "Budget",
      value: commission.brief.budget,
    },
    {
      label: locale === "fa" ? "حس" : "Mood",
      value: commission.brief.feeling,
    },
    {
      label: locale === "fa" ? "رنگ" : "Colours",
      value: commission.brief.colors?.length ? commission.brief.colors.join(" / ") : "",
    },
    {
      label: locale === "fa" ? "آزادی سازنده" : "Maker freedom",
      value:
        typeof commission.brief.freedom === "number" ? `${commission.brief.freedom}%` : "",
    },
    {
      label: locale === "fa" ? "اجازه غافلگیری" : "Permission for surprise",
      value: commission.brief.permission,
    },
  ].filter((row) => Boolean(row.value?.toString().trim()));

  return (
    <>
      <h2>{locale === "fa" ? "مشخصات ارسال‌شده" : "Submitted specification"}</h2>
      <dl className="making-brief">
        {rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      {images.length ? (
        <ul className="making-brief-images">
          {images.map((src, index) => (
            <li key={`${src.slice(0, 24)}-${index}`}>
              <img src={src} alt={t("generatedAlt")} />
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
