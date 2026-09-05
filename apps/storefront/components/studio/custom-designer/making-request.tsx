"use client";

import { Button } from "@/components/ui/button-link";
import { useLocale } from "@/components/i18n";

export function MakingRequest({
  intendedUse,
  setIntendedUse,
  onSubmit,
}: {
  intendedUse: string;
  setIntendedUse: (value: string) => void;
  onSubmit: () => void;
}) {
  const { t } = useLocale();
  return (
    <section className="making-request">
      <span className="eyebrow">{t("makingEyebrow")}</span>
      <h2>{t("makingSubmit")}</h2>
      <p>{t("makingBody")}</p>
      <label htmlFor="intended-use">{t("makingUseLabel")}</label>
      <textarea
        id="intended-use"
        value={intendedUse}
        onChange={(event) => setIntendedUse(event.target.value)}
        placeholder={t("makingUsePlaceholder")}
        aria-describedby="use-help"
      />
      <small id="use-help">{t("makingUseHelp")}</small>
      <div className="making-actions">
        <Button type="button" onClick={onSubmit}>
          {t("makingSubmit")}
        </Button>
      </div>
    </section>
  );
}
