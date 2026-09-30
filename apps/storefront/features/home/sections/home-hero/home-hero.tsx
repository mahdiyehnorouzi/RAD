"use client";

import { ButtonLink } from "@/components/ui/button-link";
import { useLocale } from "@/components/i18n";
import { HeroCards } from "./hero-cards";
import styles from "./home-hero.module.css";

export function HomeHero() {
  const { locale, t } = useLocale();

  return (
    <section className={styles.hero} id="home-hero">
      <div className={styles.heroCopy}>
        <h1>
          <span className={styles.heroLine}>
            <span>
              {t("heroTitleLead")}{" "}
              {locale === "fa" ? (
                <mark className={styles.heroStamp}>{t("heroStamp")}</mark>
              ) : null}
            </span>
          </span>{" "}
          <span className={styles.heroLine}>
            <span>
              {t("heroTitleRest")}
              {locale === "en" ? (
                <>
                  {" "}
                  <mark className={styles.heroStamp}>{t("heroStamp")}</mark>.
                </>
              ) : null}
            </span>
          </span>
        </h1>
      </div>
      <HeroCards />
      <div className={styles.heroActions}>
        <ButtonLink href="/products">{t("heroViewWorks")}</ButtonLink>
        <ButtonLink href="/studio" outline>
          {t("heroCustomOrder")}
        </ButtonLink>
      </div>
      <span
        className={styles.heroThreadStart}
        data-thread-anchor
        aria-hidden="true"
      />
      <span className={styles.heroEdge} aria-hidden="true" />
    </section>
  );
}
