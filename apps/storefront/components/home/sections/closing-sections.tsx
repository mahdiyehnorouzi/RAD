"use client";

import { ButtonLink } from "@/components/ui/button-link";
import { Eyebrow, PageSection } from "@/components/ui/section";
import { useLocale } from "@/components/i18n";

export function OrdersEntry() {
  const { t } = useLocale();
  return (
    <PageSection className="orders-entry">
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
    <PageSection className="final-cta">
      <div>
        <Eyebrow>{t("finalCtaEyebrow")}</Eyebrow>
        <h2 className="m-0 max-w-2xl text-h2 font-normal">
          {t("finalCtaTitle")}
        </h2>
      </div>
      <ButtonLink href="/studio">{t("designMine")}</ButtonLink>
    </PageSection>
  );
}
