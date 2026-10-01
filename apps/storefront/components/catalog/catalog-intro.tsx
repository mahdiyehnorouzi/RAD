"use client";

import { useLocale } from "@/components/i18n";

export function CatalogIntro() {
  const { t } = useLocale();
  return (
    <div className="plp-banner-intro">
      <h1 className="plp-title">{t("shopTitle")}</h1>
      <p className="plp-lede">{t("shopBody")}</p>
    </div>
  );
}
