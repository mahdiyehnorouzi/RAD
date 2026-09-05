"use client";
import { ButtonLink } from "@/components/ui/button-link";
import { useLocale } from "@/components/i18n";
import "./entry-paths.css";

export function EntryPaths() {
  const { locale, t } = useLocale();
  return (
    <section className="entry-paths section" aria-label={locale === "fa" ? "دو مسیر رَد" : "Two ways into RAD"}>
      <article>
        <span>I — {locale === "fa" ? "انتخاب" : "OWN"}</span>
        <h2>{locale === "fa" ? "یک رَد را انتخاب کنید" : "Own a RAD"}</h2>
        <p>
          {locale === "fa"
            ? "اثری آماده، شماره‌گذاری‌شده و تنها در یک نسخه."
            : "Choose a finished, numbered work that exists only once."}
        </p>
        <ButtonLink href="/products" outline>
          {t("viewWorks")}
        </ButtonLink>
      </article>
      <article>
        <span>II — {locale === "fa" ? "خلق" : "CREATE"}</span>
        <h2>{locale === "fa" ? "رَد خودتان را بسازید" : "Create your RAD"}</h2>
        <p>
          {locale === "fa"
            ? "از ایده و تصویر اولیه تا بررسی هنرمند و ساخت یک قطعه شخصی."
            : "Move from an idea and first visualization to artist review and a personal piece."}
        </p>
        <ButtonLink href="/studio" outline>
          {t("designMine")}
        </ButtonLink>
      </article>
    </section>
  );
}
