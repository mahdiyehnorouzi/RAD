"use client";

import { Eyebrow } from "@/components/ui/section";
import { useLocale } from "@/components/i18n";

export function CatalogIntro() {
  const { t } = useLocale();
  return (
    <>
      <Eyebrow>{t("shopEyebrow")}</Eyebrow>
      <h1 className="plp-title">{t("shopTitle")}</h1>
      <p className="plp-lede">{t("shopBody")}</p>
    </>
  );
}
