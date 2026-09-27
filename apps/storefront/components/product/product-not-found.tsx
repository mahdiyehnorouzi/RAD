"use client";

import { ButtonLink } from "@/components/ui/button-link";
import { StatePanel } from "@/components/ui/state-panel";
import { useLocale } from "@/components/i18n";

export function ProductNotFound() {
  const { t } = useLocale();
  return (
    <section className="section">
      <StatePanel
        as="h1"
        eyebrow={t("productNotFoundEyebrow")}
        title={t("productNotFoundTitle")}
        actions={
          <>
            <ButtonLink href="/products">{t("viewWorks")}</ButtonLink>
            <ButtonLink href="/archive" outline>
              {t("viewArchive")}
            </ButtonLink>
          </>
        }
      >
        <p>{t("productNotFoundBody")}</p>
      </StatePanel>
    </section>
  );
}
