"use client";

import { ButtonLink } from "@/components/ui/button-link";
import { useLocale } from "@/components/i18n";
import { HeroCards } from "./hero-cards";
import "./home-hero.css";

export function HomeHero() {
  const { locale, t } = useLocale();

  return (
    <section className="hero" id="home-hero">
      <div className="hero-copy">
        <h1>
          <span className="hero-line">
            <span>
              {t("heroTitleLead")}{" "}
              {locale === "fa" ? <mark className="hero-stamp">{t("heroStamp")}</mark> : null}
            </span>
          </span>{" "}
          <span className="hero-line">
            <span>
              {t("heroTitleRest")}
              {locale === "en" ? (
                <>
                  {" "}
                  <mark className="hero-stamp">{t("heroStamp")}</mark>.
                </>
              ) : null}
            </span>
          </span>
        </h1>
      </div>
      <HeroCards />
      <div className="hero-actions">
        <ButtonLink href="/products" className="hero-button">
          {t("heroViewWorks")}
        </ButtonLink>
        <ButtonLink href="/studio" outline className="hero-button">
          {t("heroCustomOrder")}
        </ButtonLink>
      </div>
      <span className="hero-thread-start" data-thread-anchor aria-hidden="true" />
      <span className="hero-edge" aria-hidden="true" />
    </section>
  );
}
