"use client";
import "./making-request.css";

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
      <label htmlFor="intended-use">{t("makingUseLabel")}</label>
      <textarea
        id="intended-use"
        value={intendedUse}
        onChange={(event) => setIntendedUse(event.target.value)}
        placeholder={t("makingUsePlaceholder")}
      />
      <div className="making-actions">
        <Button type="button" onClick={onSubmit} disabled={!intendedUse.trim()}>
          {t("makingSubmit")}
        </Button>
      </div>
    </section>
  );
}
