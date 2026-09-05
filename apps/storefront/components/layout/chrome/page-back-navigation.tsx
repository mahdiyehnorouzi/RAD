"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLocale } from "@/components/i18n";
import { useBackNavigation } from "@/hooks/use-back-navigation";

export function PageBackNavigation() {
  const { locale, t } = useLocale();
  const { isHome, goBack } = useBackNavigation();
  if (isHome) return null;
  const BackIcon = locale === "fa" ? ArrowRight : ArrowLeft;
  return (
    <div className="route-back-bar">
      <button type="button" className="route-back-button" onClick={goBack}>
        <BackIcon aria-hidden="true" />
        <span>{t("previousPage")}</span>
      </button>
    </div>
  );
}
