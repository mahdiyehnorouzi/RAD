"use client";
import { CustomDesigner } from "@/components/custom-designer";
import { PageSection } from "@/components/ui/section";
import { useLocale } from "@/components/i18n";

export default function Studio() {
  const { t } = useLocale();
  return (
    <PageSection className="bg-rad-moss text-rad-paper">
      <CustomDesigner />
      <div className="mt-10 grid gap-3 text-sm text-rad-paper/70 md:grid-cols-3">
        <span>{t("note1")}</span>
        <span>{t("note2")}</span>
        <span>{t("note3")}</span>
      </div>
    </PageSection>
  );
}
