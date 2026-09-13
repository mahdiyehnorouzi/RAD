"use client";

import { useState } from "react";
import { useLocale } from "@/components/i18n";
import { formatPassportCode } from "@/lib/passport";
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
      <div className="passport-mark-stamp" aria-hidden="true">
        {Array.from({ length: 25 }, (_, index) => {
          const on = (Number(passport.code) * (index + 3)) % 7 > 2;
          return <i key={index} className={on ? "is-on" : ""} />;
        })}
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
