"use client";
import { useLocale } from "@/components/i18n";

export function StorySection() {
  const { locale, t } = useLocale();
  return (
    <section id="story" className="section story human-story">
      <span className="big-number">{locale === "fa" ? "۱/۱" : "1/1"}</span>
      <div>
        <span className="eyebrow">{t("philosophy")}</span>
        <h2>
          {locale === "fa"
            ? "رَد از میل به ساختن اشیایی شروع شد که برای هیچ‌کس دیگری ساخته نشده‌اند."
            : "RAD began with the desire to make objects created for no one else."}
        </h2>
        <p>
          {locale === "fa"
            ? "هر اثر در گفت‌وگوی مستقیم میان نگاه هنرمند، ماده و دست شکل می‌گیرد. تفاوت‌ها نقص نیستند؛ امضای فرآیندند."
            : "Each work takes shape through a direct conversation between the maker's eye, material, and hand. Variations are the process's signature."}
        </p>
      </div>
    </section>
  );
}

export function ProvenanceSection() {
  const { locale } = useLocale();
  return (
    <section className="provenance section">
      <header>
        <span className="eyebrow">III — {locale === "fa" ? "منشأ اثر" : "PROVENANCE"}</span>
        <h2>
          {locale === "fa" ? "ارزش یک اثر، در مسیر ساخت آن است." : "A work earns its value through how it is made."}
        </h2>
      </header>
      <div className="provenance-grid">
        <article>
          <b>{locale === "fa" ? "ساخت در تهران" : "Made in Tehran"}</b>
          <p>
            {locale === "fa"
              ? "هنرمند، متریال و تمام مراحل ساخت هر اثر در شناسنامه آن ثبت می‌شود."
              : "The maker, material, and every making stage are recorded in the work's provenance."}
          </p>
        </article>
        <article>
          <b>{locale === "fa" ? "ردِ دست حفظ می‌شود" : "The hand remains visible"}</b>
          <p>
            {locale === "fa"
              ? "تفاوت‌های طبیعی هر ماده پنهان نمی‌شوند؛ همان‌ها بخشی از هویت اثرند."
              : "Natural variations in every material remain visible as part of the work's identity."}
          </p>
        </article>
        <article>
          <b>{locale === "fa" ? "شماره و شناسنامه" : "Numbered provenance"}</b>
          <p>
            {locale === "fa"
              ? "هر اثر با شماره، متریال، سال و نشان ۱/۱ ثبت می‌شود."
              : "Each work is recorded with its number, material, year, and 1/1 mark."}
          </p>
        </article>
      </div>
    </section>
  );
}

export function ProcessSection() {
  const { locale, t } = useLocale();
  const steps = [
    [locale === "fa" ? "۰۱/۰۴" : "01/04", t("step1Title"), t("step1Body")],
    [locale === "fa" ? "۰۲/۰۴" : "02/04", t("step2Title"), t("step2Body")],
    [locale === "fa" ? "۰۳/۰۴" : "03/04", t("step3Title"), t("step3Body")],
    [locale === "fa" ? "۰۴/۰۴" : "04/04", t("step4Title"), t("step4Body")],
  ];
  return (
    <section className="section process">
      <header className="section-heading">
        <div>
          <span className="eyebrow">{t("processEyebrow")}</span>
          <h2>{t("processTitle")}</h2>
        </div>
      </header>
      <div className="steps">
        {steps.map((x) => (
          <article key={x[0]}>
            <span>{x[0]}</span>
            <h3>{x[1]}</h3>
            <p>{x[2]}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
