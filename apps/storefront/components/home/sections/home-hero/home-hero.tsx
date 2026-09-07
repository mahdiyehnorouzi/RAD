"use client";

import { ButtonLink } from "@/components/ui/button-link";
import { useLocale } from "@/components/i18n";
import { PolaroidSwap } from "./polaroid-swap";
import "./home-hero.css";

export function HomeHero() {
  const { locale, t } = useLocale();

  return (
    <section className="hero section">
      <div className="hero-copy">
        <h1>
          <span className="hero-line">
            {t("heroTitleLead")}{" "}
            {locale === "fa" ? <mark className="hero-stamp">{t("heroStamp")}</mark> : null}
          </span>
          <span className="hero-line">
            {t("heroTitleRest")}
            {locale === "en" ? (
              <>
                <mark className="hero-stamp">{t("heroStamp")}</mark>.
              </>
            ) : null}
          </span>
        </h1>
        <p className="hero-thesis">{t("heroThesis")}</p>
        <div className="hero-actions">
          <ButtonLink href="/products">{t("heroViewWorks")}</ButtonLink>
          <ButtonLink href="/studio" outline>
            {t("footerCustom")}
          </ButtonLink>
        </div>
      </div>
      <div className="hero-art">
        <PolaroidSwap />
      </div>
    </section>
  );
}
