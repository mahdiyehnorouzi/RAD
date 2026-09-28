"use client";

import { ButtonLink } from "@/components/ui/button-link";
import { useLocale } from "@/components/i18n";
import { HeroCards } from "./hero-cards";
import { HeroScene } from "./hero-scene";
import { HeroSprig } from "./hero-sprig";
import "./home-hero.css";

/** Where the red thread ends in a bead; below it the thread runs behind the hero until the buttons. */
function HeroKnot() {
  return (
    <span
      className="hero-knot"
      data-thread-anchor
      data-thread-knot
      data-thread-hide="start"
      aria-hidden="true"
    />
  );
}

export function HomeHero() {
  const { locale, t } = useLocale();

  return (
    <section className="hero" id="home-hero">
      <HeroScene />
      <span className="hero-thread-top" data-thread-anchor aria-hidden="true" />
      <div className="hero-copy">
        <h1>
          <span className="hero-line">
            <span>
              {t("heroTitleLead")}{" "}
              {locale === "fa" ? (
                <mark className="hero-stamp">
                  {t("heroStamp")}
                  <HeroKnot />
                </mark>
              ) : (
                <HeroKnot />
              )}
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
        <p className="hero-thesis">{t("heroThesis")}</p>
      </div>
      <HeroCards />
      <div className="hero-actions">
        <ButtonLink href="/products" className="hero-button">
          {t("heroViewWorks")}
          <HeroSprig />
        </ButtonLink>
        <ButtonLink href="/about" outline className="hero-button">
          {t("navAbout")}
          <HeroSprig />
        </ButtonLink>
        <span className="hero-thread-exit" data-thread-anchor data-thread-hide="end" aria-hidden="true" />
      </div>
      <span className="hero-edge" aria-hidden="true" />
    </section>
  );
}
