"use client";

import { useLocale } from "@/components/i18n";

export function CatalogIntro() {
  const { locale } = useLocale();
  return (
    <div className="plp-banner-intro">
      <h1 className="plp-title">
        {locale === "fa" ? "آثار یگانه" : "One-of-a-kind works"}
      </h1>
      <p className="plp-lede">
        {locale === "fa"
          ? "هر کدام، فقط یک‌بار ساخته می‌شود."
          : "Each one is made only once."}
      </p>
    </div>
  );
}
