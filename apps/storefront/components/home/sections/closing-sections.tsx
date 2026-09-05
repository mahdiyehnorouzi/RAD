"use client";
import { ButtonLink } from "@/components/ui/button-link";
import { useLocale } from "@/components/i18n";

export function OrdersEntry() {
  const { locale } = useLocale();
  return (
    <section className="section orders-entry">
      <div>
        <span className="eyebrow">{locale === "fa" ? "سفارش‌های شما" : "YOUR ORDERS"}</span>
        <h2>{locale === "fa" ? "مسیر ساخت اثرتان را دنبال کنید." : "Follow your work as it is made."}</h2>
        <p>
          {locale === "fa"
            ? "از تأیید طرح و انتخاب هنرمند تا ساخت، امضا و ارسال."
            : "From concept approval and maker selection to production, signature, and delivery."}
        </p>
      </div>
      <ButtonLink href="/orders" outline>
        {locale === "fa" ? "دیدن سفارش‌ها" : "View orders"}
      </ButtonLink>
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
