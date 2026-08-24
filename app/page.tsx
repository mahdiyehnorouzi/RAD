"use client";
import Link from "next/link";
import { ButtonLink, ProductCard, Vessel } from "@/components/site";
import { products } from "@/lib/products";
import { useLocale } from "@/components/i18n";
export default function Home() {
  const { t, href, locale } = useLocale();
  const steps = [
    [locale === "fa" ? "۰۱" : "01", t("step1Title"), t("step1Body")],
    [locale === "fa" ? "۰۲" : "02", t("step2Title"), t("step2Body")],
    [locale === "fa" ? "۰۳" : "03", t("step3Title"), t("step3Body")],
    [locale === "fa" ? "۰۴" : "04", t("step4Title"), t("step4Body")],
  ];
  return (
    <>
      <section className="hero section">
        <div className="hero-copy">
          <span className="eyebrow">{t("heroEyebrow")}</span>
          <h1>
            {t("heroTitle1")}
            <br />
            {t("heroTitle2")}
          </h1>
          <p>{t("heroBody")}</p>
          <div className="actions">
            <ButtonLink href="/studio">{t("designMine")}</ButtonLink>
            <ButtonLink href="/products" outline>
              {t("viewWorks")}
            </ButtonLink>
          </div>
        </div>
        <div className="hero-art">
          <span className="one-badge">
            <b>{locale === "fa" ? "۱ / ۱" : "1 / 1"}</b>
            {t("onlyOne")}
          </span>
          <span className="sun-disc" />
          <Vessel product={products[0]} />
          <small>{t("artworkLabel")}</small>
        </div>
      </section>
      <section className="ticker" aria-label={t("featureHandmade")}>
        <span>{t("featureHandmade")}</span>
        <i>•</i>
        <span>{t("featureUnique")}</span>
        <i>•</i>
        <span>{t("featureTehran")}</span>
        <i>•</i>
        <span>{t("featureIran")}</span>
      </section>
      <section className="section collection">
        <header className="section-heading">
          <div>
            <span className="eyebrow">{t("collectionEyebrow")}</span>
            <h2>{t("collectionTitle")}</h2>
            <p>{t("collectionBody")}</p>
          </div>
          <ButtonLink href="/products" outline>
            {t("allWorks")}
          </ButtonLink>
        </header>
        <div className="product-grid home-products">
          {products.slice(0, 3).map((p, i) => (
            <ProductCard product={p} index={i} key={p.slug} />
          ))}
        </div>
      </section>
      <section className="studio-callout section">
        <div className="studio-visual">
          <span className="orbit o1" />
          <span className="orbit o2" />
          <Vessel product={products[1]} />
        </div>
        <div>
          <span className="eyebrow">{t("studioEyebrow")}</span>
          <h2>
            {t("studioTitle1")}
            <br />
            {t("studioTitle2")}
          </h2>
          <p>{t("studioBody")}</p>
          <ButtonLink href="/studio" light>
            {t("enterStudio")}
          </ButtonLink>
        </div>
      </section>
      <section id="story" className="section story">
        <span className="big-number">{locale === "fa" ? "۱/۱" : "1/1"}</span>
        <div>
          <span className="eyebrow">{t("philosophy")}</span>
          <h2>{t("philosophyTitle")}</h2>
          <p>{t("philosophyBody")}</p>
        </div>
      </section>
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
      <section id="journal" className="journal section">
        <div className="journal-art">
          <div className="clay-rings" />
        </div>
        <div>
          <span className="eyebrow">
            {locale === "fa" ? "ژورنال رَد" : "RAD JOURNAL"}
          </span>
          <h2>
            {t("journalTitle1")}
            <br />
            {t("journalTitle2")}
          </h2>
          <p>{t("journalBody")}</p>
          <Link href={href("/#journal")} className="text-link">
            {t("readJournal")}
          </Link>
        </div>
      </section>
    </>
  );
}
