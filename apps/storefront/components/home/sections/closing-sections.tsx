"use client";
import { ButtonLink } from "@/components/ui/button-link";
import { useLocale } from "@/components/i18n";
import "./closing-sections.css";

export function OrdersEntry() {
  const { locale } = useLocale();
  return (
    <section className="section orders-entry">
      <div>
        <span className="eyebrow">{locale === "fa" ? "سفارش‌های شما" : "YOUR ORDERS"}</span>
        <h2>{locale === "fa" ? "مسیر ساخت اثرتان را دنبال کنید." : "Follow your work as it is made."}</h2>
        <p>
          {locale === "fa"
            ? "سفارش اختصاصی شش بخش دارد: توصیف، تصویر نیت، بازبینی هنرمند، پیشنهاد و بیعانه، ساخت و زونْد، رونمایی و ارسال. پاسخ هنرمند در مسیر ساخت و اعلان‌ها می‌آید."
            : "A custom order has six parts: describe, intention image, artist review, quote and deposit, making and Zünd, reveal and delivery. The artist’s reply appears on the making path and in notifications."}
        </p>
      </div>
      <ButtonLink href="/making" outline>
        {locale === "fa" ? "مسیر ساخت" : "Making path"}
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
