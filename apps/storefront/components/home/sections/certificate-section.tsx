"use client";

import { useLocale } from "@/components/i18n";
import { homeMedia } from "../const";
import { useInView } from "../hooks";
import "../motion/reveal.css";
import "./certificate-section.css";

export function CertificateSection() {
  const { t } = useLocale();
  const { ref, inView } = useInView<HTMLElement>({ threshold: 0.08, rootMargin: "80px 0px" });
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
      <figure className="certificate-visual">
        <img
          src={homeMedia.certificate}
          alt={t("certificatePhotoAlt")}
          loading="lazy"
          decoding="async"
        />
      </figure>
      <p className="certificate-edition" aria-hidden="true">
        {t("editionMark")}
      </p>
      <aside className="certificate-card">
        <span className="eyebrow">{t("certificateEyebrow")}</span>
        <h2 id="certificate-title">{t("certificateTitle")}</h2>
        <ul>
          {facts.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      </aside>
    </section>
  );
}
