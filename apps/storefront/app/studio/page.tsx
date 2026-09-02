"use client";
import Link from "next/link";
import { CustomDesigner } from "@/components/studio";
import { PageSection } from "@/components/ui/section";
import { useLocale } from "@/components/i18n";

export default function Studio() {
  const { t, href } = useLocale();
  return (
    <PageSection className="studio-page bg-rad-moss text-rad-paper">
      <CustomDesigner />
      <div className="mt-10 grid gap-3 text-sm text-rad-paper/70 md:grid-cols-3">
        <span>{t("note1")}</span>
        <span>{t("note2")}</span>
        <span>{t("note3")}</span>
        <Link href={href("/workshop")}>{t("workshopTitle")}</Link>
      </div>
    </PageSection>
  );
}
