"use client";
import { ButtonLink } from "@/components/ui/button-link";
import { useLocale } from "@/components/i18n";
import "./closing-sections.css";

export function OrdersEntry() {
  const { t } = useLocale();
  return (
    <section className="section orders-entry">
      <div>
        <span className="eyebrow">{t("ordersEntryEyebrow")}</span>
        <h2>{t("ordersEntryTitle")}</h2>
        <p>{t("ordersEntryBody")}</p>
      </div>
      <div className="orders-entry-actions">
        <ButtonLink href="/products" outline>
          {t("viewAvailableWorks")}
        </ButtonLink>
        <ButtonLink href="/making" outline>
          {t("makingProcessTitle")}
        </ButtonLink>
      </div>
    </section>
  );
}

export function FinalCta() {
  const { locale, t } = useLocale();
  return (
    <section className="section final-cta">
      <span className="eyebrow">{locale === "fa" ? "قطعه شما" : "YOUR OBJECT"}</span>
      <h2>
        {locale === "fa"
          ? "چیزی را شروع کنید که فقط یک بار ساخته می‌شود."
          : "Start something that will be made only once."}
      </h2>
      <ButtonLink href="/studio">{t("designMine")}</ButtonLink>
    </section>
  );
}
