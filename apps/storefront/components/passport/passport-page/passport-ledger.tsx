"use client";

import { useLocale } from "@/components/i18n";
import type { MessageKey } from "@/i18n/fa";
import type { RadPassport } from "../type";

const rows: Array<[MessageKey, keyof Pick<
  RadPassport,
  "maker" | "dateCreated" | "clay" | "glaze" | "dimensions" | "firing" | "inspiration" | "owner" | "city"
>]> = [
  ["passportMaker", "maker"],
  ["passportDate", "dateCreated"],
  ["passportClay", "clay"],
  ["passportGlaze", "glaze"],
  ["passportDimensions", "dimensions"],
  ["passportFiring", "firing"],
  ["passportInspiration", "inspiration"],
  ["passportOwner", "owner"],
  ["passportCity", "city"],
];

export function PassportLedger({ passport }: { passport: RadPassport }) {
  const { locale, t } = useLocale();
  return (
    <section className="passport-ledger" aria-labelledby="passport-ledger-title">
      <h2 id="passport-ledger-title">{t("passportLedger")}</h2>
      <dl>
        {rows.map(([key, field]) => (
          <div key={key}>
            <dt>{t(key)}</dt>
            <dd>{passport[field][locale]}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
