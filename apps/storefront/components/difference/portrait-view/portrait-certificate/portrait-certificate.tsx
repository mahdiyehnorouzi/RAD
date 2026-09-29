"use client";
import "./portrait-certificate.css";

import { useLocale } from "@/components/i18n";
import type { DifferencePortrait } from "../../type";
import { CertificateMark } from "./certificate-mark";

export function PortraitCertificate({ portrait }: { portrait: DifferencePortrait }) {
  const { locale, t, number } = useLocale();
  return (
    <section className="difference-certificate" aria-labelledby="difference-certificate-title">
      <header className="difference-certificate-head">
        <div>
          <h2 id="difference-certificate-title">{t("differenceCertificate")}</h2>
          <p>{t("differenceCertificateBody")}</p>
        </div>
        <CertificateMark code={portrait.code} />
      </header>
      <dl className="material-fingerprint">
        <div>
          <dt>{t("fingerprintBatch")}</dt>
          <dd>{portrait.fingerprint.clay[locale]}</dd>
        </div>
        <div>
          <dt>{t("fingerprintSurface")}</dt>
          <dd>{portrait.fingerprint.glaze[locale]}</dd>
        </div>
        <div>
          <dt>{t("fingerprintFiring")}</dt>
          <dd>{portrait.fingerprint.firing[locale]}</dd>
        </div>
        <div>
          <dt>{t("fingerprintMark")}</dt>
          <dd>{portrait.fingerprint.irregularity[locale]}</dd>
        </div>
      </dl>
      <p className="difference-year" dir="ltr">
        {portrait.code} · TEHRAN / {portrait.year} · {number(1)} / {number(1)}
      </p>
    </section>
  );
}
