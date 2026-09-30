"use client";

import { useLocale } from "@/components/i18n";
import { useInView } from "../../hooks";
import { CertificateScene } from "./certificate-scene";
import { CertificateSeal } from "./certificate-seal";
import { CertificateThread } from "./certificate-thread";
import styles from "./certificate-section.module.css";

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
      className={styles.certificate}
      data-visible={inView || undefined}
      aria-labelledby="certificate-title"
    >
      <CertificateScene alt={t("certificatePhotoAlt")} />
      <p className={styles.certificateEdition} aria-hidden="true">
        <span className={styles.certificateEditionNumber}>
          {t("editionMark")}
        </span>
        <svg
          className={styles.certificateEditionRule}
          viewBox="0 0 120 8"
          preserveAspectRatio="none"
        >
          <path d="M2 7C34 3 78 1.5 118 2.5" />
        </svg>
        <span className={styles.certificateEditionBrand}>RĀD</span>
      </p>
      <aside className={styles.certificateCard}>
        <span className={styles.certificatePaper} aria-hidden="true" />
        <CertificateThread />
        <span className={styles.certificateEyebrow}>
          {t("certificateEyebrow")}
          <svg
            viewBox="0 0 100 10"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M1 8.5C28 4 62 2.2 99 3.2" />
          </svg>
        </span>
        <h2 id="certificate-title">{t("certificateTitle")}</h2>
        <ul>
          {facts.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
        <CertificateSeal />
      </aside>
    </section>
  );
}
