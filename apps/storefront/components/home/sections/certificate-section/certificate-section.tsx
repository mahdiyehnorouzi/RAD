"use client";

import { useLocale } from "@/components/i18n";
import { useInView } from "../../hooks";
import { ButtonLink } from "@/components/ui/button-link";
import { CertificateScene } from "./certificate-scene";
import { CertificateSeal } from "./certificate-seal";
import { CertificateThread } from "./certificate-thread";
import "../../motion/reveal.css";
import "./certificate-section.css";

export function CertificateSection() {
  const { t } = useLocale();
  const { ref, inView } = useInView<HTMLElement>({
    threshold: 0.08,
    rootMargin: "80px 0px",
  });
  const facts = [
    t("certificateArtist"),
    t("certificateMaterial"),
    t("certificateNumber"),
  ];

  return (
    <section
      ref={ref}
      className={`certificate${inView ? " is-visible" : ""}`}
      aria-labelledby="certificate-title"
    >
      <CertificateScene alt={t("certificatePhotoAlt")} />
      <span className="certificate-tear" aria-hidden="true" />
      <p className="certificate-edition" aria-hidden="true">
        <span className="certificate-edition-number">{t("editionMark")}</span>
        <svg className="certificate-edition-rule" viewBox="0 0 120 8" preserveAspectRatio="none">
          <path d="M2 7C34 3 78 1.5 118 2.5" />
        </svg>
        <span className="certificate-edition-brand">RĀD</span>
      </p>
      <aside className="certificate-card">
        <span className="certificate-paper" aria-hidden="true" />
        <CertificateThread />
        <span className="certificate-eyebrow">
          {t("certificateEyebrow")}
          <svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
            <path d="M1 8.5C28 4 62 2.2 99 3.2" />
          </svg>
        </span>
        <h2 id="certificate-title">{t("certificateTitle")}</h2>
        <ul>
          {facts.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
        <ButtonLink href="/passport/007">{t("pdpPassportLink")}</ButtonLink>
        <CertificateSeal />
      </aside>
      <span className="certificate-edge" aria-hidden="true" />
    </section>
  );
}
