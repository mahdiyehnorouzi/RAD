"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useBackNavigation } from "@/hooks/use-back-navigation";
import { useLocale } from "@/components/i18n";

export function PageBackNavigation() {
  const { locale, t } = useLocale();
  const { goBack, isHome } = useBackNavigation();
  if (isHome) return null;

  const BackIcon = locale === "fa" ? ArrowRight : ArrowLeft;

  return (
    <div className="mx-auto w-full max-w-site px-page pt-3.5">
      <button
        type="button"
        className="inline-flex min-h-[42px] items-center gap-2 border-0 border-b border-rad-line bg-transparent py-1.5 text-[0.82rem] text-rad-moss hover:border-rad-clay hover:text-rad-clay"
        onClick={goBack}
      >
        <BackIcon className="h-[18px] w-[18px]" aria-hidden="true" />
        <span>{t("previousPage")}</span>
      </button>
    </div>
  );
}
