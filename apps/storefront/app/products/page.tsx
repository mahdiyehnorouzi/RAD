"use client";
import { Catalog } from "@/components/catalog";
import { useLocale } from "@/components/i18n";
export default function Products() {
  const { t } = useLocale();
  return (
    <section className="section plp">
      <header className="plp-head">
        <span className="eyebrow">{t("shopEyebrow")}</span>
        <h1>{t("shopTitle")}</h1>
        <p>{t("shopBody")}</p>
      </header>
      <Catalog />
    </section>
  );
}
