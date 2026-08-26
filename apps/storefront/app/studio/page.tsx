"use client";
import { CustomDesigner } from "@/components/custom-designer";
import { useLocale } from "@/components/i18n";
export default function Studio() {
  const { t } = useLocale();
  return (
    <section className="studio-page section">
      <CustomDesigner />
      <div className="studio-notes">
        <span>{t("note1")}</span>
        <span>{t("note2")}</span>
        <span>{t("note3")}</span>
      </div>
    </section>
  );
}
