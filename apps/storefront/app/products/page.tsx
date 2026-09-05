"use client";
import { Catalog } from "@/components/catalog";
import { Eyebrow, PageSection } from "@/components/ui/section";
import { useLocale } from "@/components/i18n";

export default function Products() {
  const { t } = useLocale();
  return (
    <PageSection>
      <header className="mb-8">
        <Eyebrow>{t("shopEyebrow")}</Eyebrow>
        <h1 className="m-0 text-h2 font-normal">{t("shopTitle")}</h1>
        <p className="mt-3 max-w-2xl text-prose">{t("shopBody")}</p>
      </header>
      <Catalog />
    </PageSection>
  );
}
