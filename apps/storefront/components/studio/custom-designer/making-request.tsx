"use client";

import { Button } from "@/components/ui/button-link";
import { Eyebrow } from "@/components/ui/section";
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
    <section className="making-request mt-12">
      <Eyebrow className="text-rad-sand">{t("makingEyebrow")}</Eyebrow>
      <h2 className="m-0 text-h3 font-normal">{t("makingSubmit")}</h2>
      <p className="mt-3 max-w-2xl text-prose">{t("makingBody")}</p>
      <label className="mt-6 block" htmlFor="intended-use">
        {t("makingUseLabel")}
      </label>
      <textarea
        id="intended-use"
        value={intendedUse}
        onChange={(event) => setIntendedUse(event.target.value)}
        placeholder={t("makingUsePlaceholder")}
        aria-describedby="use-help"
      />
      <small id="use-help">{t("makingUseHelp")}</small>
      <div className="making-actions mt-6">
        <Button type="button" onClick={onSubmit}>
          {t("makingSubmit")}
        </Button>
      </div>
    </section>
  );
}
