"use client";
import { ButtonLink } from "@/components/ui/button-link";
import { useLocale } from "@/components/i18n";
import { useInView } from "../hooks";
import "../motion/reveal.css";
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
  const { t } = useLocale();
  const { ref, inView } = useInView<HTMLElement>({ threshold: 0.18 });
  return (
    <section
      ref={ref}
      className={`section final-cta home-reveal${inView ? " is-visible" : ""}`}
    >
      <span className="eyebrow reveal-item" data-reveal="eyebrow">
        {t("finalCtaEyebrow")}
      </span>
      <h2 className="reveal-item" data-reveal="heading">
        {t("finalCtaTitle")}
      </h2>
      <p className="reveal-item" data-reveal="body">
        {t("finalCtaLead")}
      </p>
      <div className="reveal-item" data-reveal="cta">
        <ButtonLink href="/studio">{t("startCustomDesign")}</ButtonLink>
      </div>
    </section>
  );
}
