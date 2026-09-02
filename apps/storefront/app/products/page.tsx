"use client";
import { Catalog } from "@/components/catalog";
import { Eyebrow } from "@/components/ui/section";
import { useLocale } from "@/components/i18n";

export default function Products() {
  const { t } = useLocale();
  return (
    <section className="section plp">
      <header className="plp-head">
        <Eyebrow>{t("shopEyebrow")}</Eyebrow>
        <h1>{t("shopTitle")}</h1>
        <p className="mt-3 max-w-2xl text-prose">{t("shopBody")}</p>
      </header>
      <Catalog />
    </section>
  );
}
