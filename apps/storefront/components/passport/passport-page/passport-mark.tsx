"use client";

import { useState } from "react";
import { useLocale } from "@/components/i18n";
import { ObjectStamp, RadFingerprint } from "@/components/identity";
import { formatPassportCode, passportYear } from "@/lib/passport";
import type { RadPassport } from "../type";

export function PassportMark({
  passport,
  path,
}: {
  passport: RadPassport;
  path: string;
}) {
  const { locale, t, number } = useLocale();
  const [copied, setCopied] = useState(false);
  const code = formatPassportCode(passport.code, locale, number);
  const year = passportYear(passport, locale);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.origin + path);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <aside className="passport-mark">
      <div className="passport-mark-seal">
        <ObjectStamp
          radNumber={passport.radNumber}
          code={code}
          year={year}
          label={[`RĀD ${code}`, t("oneOfOne"), year]
            .filter(Boolean)
            .join(locale === "fa" ? "، " : ", ")}
        />
        <RadFingerprint
          radNumber={passport.radNumber}
          density="field"
          className="passport-mark-print"
        />
      </div>
      <p>
        {t("passportOnce")}
        <br />
        {t("passportOnceBody")}
      </p>
      <b dir="ltr">/passport/{passport.code}</b>
      <small>
        {locale === "fa" ? `رَد ${code}` : `RAD ${code}`} · {t("oneOfOne")}
      </small>
      <button type="button" className="button outline" onClick={copyLink}>
        {copied ? t("passportCopied") : t("passportCopyLink")}
      </button>
    </aside>
  );
}
