"use client";

import { useLocale } from "@/components/i18n";
import type { MessageKey } from "@/i18n/fa";
import type { RadPassport } from "../type";

type LedgerField = keyof Pick<
  RadPassport,
  "maker" | "dateCreated" | "clay" | "glaze" | "dimensions" | "firing" | "inspiration" | "owner" | "city"
>;

const rows: Array<[MessageKey, LedgerField]> = [
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
    <dl className="passport-ledger" aria-label={t("passportLedger")}>
      {rows.map(([key, field]) => (
        <div key={key} className={field === "inspiration" ? "is-quote" : undefined}>
          <dt>{t(key)}</dt>
          <dd>{passport[field][locale]}</dd>
        </div>
      ))}
    </dl>
  );
}
