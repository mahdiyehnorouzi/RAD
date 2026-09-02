"use client";

import {
  surprisePermissions,
  type SurprisePermission,
} from "@/components/difference";
import { useLocale } from "@/components/i18n";

export function DesignerSurprise({
  permission,
  setPermission,
}: {
  permission: SurprisePermission;
  setPermission: (value: SurprisePermission) => void;
}) {
  const { t, locale } = useLocale();
  return (
    <fieldset className="surprise-permission">
      <legend>
        <small>{t("surpriseLegend")}</small>
        {t("surpriseLegend")}
      </legend>
      <div className="surprise-grid" role="radiogroup" aria-label={t("surpriseLegend")}>
        {surprisePermissions.map((item) => (
          <button
            type="button"
            key={item.id}
            className={permission === item.id ? "active" : ""}
            onClick={() => setPermission(item.id)}
            aria-pressed={permission === item.id}
          >
            <b>{item.title[locale]}</b>
            <span>{item.body[locale]}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
