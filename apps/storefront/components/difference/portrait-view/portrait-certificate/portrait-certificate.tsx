"use client";

import { useLocale } from "@/components/i18n";
import type { DifferencePortrait } from "../../type";
import { CertificateMark } from "./certificate-mark";

export function PortraitCertificate({ portrait }: { portrait: DifferencePortrait }) {
  const { locale, t, number } = useLocale();
  return (
    <aside className="difference-certificate" aria-label={t("differenceCertificate")}>
      <CertificateMark code={portrait.code} />
      <div>
        <span className="eyebrow">{t("differenceCertificate")}</span>
        <p>{t("differenceCertificateBody")}</p>
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
      </div>
    </aside>
  );
}
