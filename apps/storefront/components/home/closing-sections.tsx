"use client";

import { ButtonLink } from "@/components/ui/button-link";
import { Eyebrow, PageSection } from "@/components/ui/section";
import { useLocale } from "@/components/i18n";

export function OrdersEntry() {
  const { t } = useLocale();
  return (
    <PageSection className="flex flex-col items-start justify-between gap-8 bg-[color-mix(in_srgb,theme(colors.rad.sand)_18%,theme(colors.rad.paper))] md:flex-row md:items-end">
      <div>
        <Eyebrow>{t("ordersEntryEyebrow")}</Eyebrow>
        <h2 className="m-0 text-h2 font-normal">{t("ordersEntryTitle")}</h2>
        <p className="mt-4 max-w-xl text-prose">{t("ordersEntryBody")}</p>
      </div>
      <ButtonLink href="/orders" outline>
        {t("viewOrders")}
      </ButtonLink>
    </PageSection>
  );
}

export function FinalCta() {
  const { t } = useLocale();
  return (
    <PageSection className="text-center">
      <Eyebrow>{t("finalCtaEyebrow")}</Eyebrow>
      <h2 className="mx-auto mb-8 max-w-2xl text-h2 font-normal">
        {t("finalCtaTitle")}
      </h2>
      <ButtonLink href="/studio">{t("designMine")}</ButtonLink>
    </PageSection>
  );
}
