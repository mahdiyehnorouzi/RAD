"use client";

import { ProcessSection } from "@/components/home";
import { ButtonLink } from "@/components/ui/button-link";
import { useLocale } from "@/components/i18n";
import "./making-process.css";

export function MakingProcess() {
  const { t } = useLocale();
  return (
    <>
      <ProcessSection asPage />
      <div className="making-process-cta">
        <ButtonLink href="/studio">{t("startCustomOrder")}</ButtonLink>
        <ButtonLink href="/making/RAD-M-1405-17" outline>
          {t("viewSamplePath")}
        </ButtonLink>
      </div>
    </>
  );
}
