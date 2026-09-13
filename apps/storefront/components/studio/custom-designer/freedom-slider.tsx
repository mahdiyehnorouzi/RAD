"use client";

import { useLocale } from "@/components/i18n";
import "./freedom-slider.css";

export function FreedomSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const { t, number, locale } = useLocale();
  return (
    <fieldset className="freedom-slider">
      <legend>
        <small>{t("designerFreedomLegend")}</small>
        {t("designerFreedomTitle")}
      </legend>
      <p className="freedom-share">
        {t("designerFreedomShare", {
          value: locale === "fa" ? `${number(value)}٪` : `${number(value)}%`,
        })}
      </p>
      <label>
        <span className="visually-hidden">{t("designerFreedomLegend")}</span>
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </label>
      <div className="freedom-ends">
        <span>{t("designerFreedomLow")}</span>
        <span>{t("designerFreedomHigh")}</span>
      </div>
    </fieldset>
  );
}
