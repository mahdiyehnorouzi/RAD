"use client";
import { ButtonLink } from "@/components/ui/button-link";
import { useLocale } from "@/components/i18n";
import { homeMedia } from "../const";
import "./certificate-section.css";

export function CertificateSection() {
  const { t } = useLocale();
  const facts = [
    t("certificateArtist"),
    t("certificateMaterial"),
    t("certificateNumber"),
  ];
  return (
    <section className="certificate section">
      <div className="certificate-layout">
        <figure className="certificate-visual">
          <img
            src={homeMedia.certificate}
            alt={t("certificatePhotoAlt")}
            loading="lazy"
            decoding="async"
          />
        </figure>
        <div className="certificate-copy">
          <h2>{t("certificateTitle")}</h2>
          <ul>
            {facts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
          <div className="certificate-cta">
            <p className="certificate-lead">{t("finalCtaLead")}</p>
            <h3>{t("finalCtaTitle")}</h3>
            <ButtonLink href="/studio" light>
              {t("startCustomDesign")}
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
