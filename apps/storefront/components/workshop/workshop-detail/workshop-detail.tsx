"use client";

import { useState } from "react";
import { copy, deadlineWarning } from "@/lib/making";
import { useMaking } from "@/hooks/use-making-workspace";
import { useLocale } from "@/components/i18n";
import { ButtonLink } from "@/components/ui/button-link";
import { BiographyRail, SituationBanner } from "@/components/making";
import { WorkshopAuditTab, WorkshopWorkTab } from "./workshop-tabs";

export function ArtistWorkshopDetail({ id }: { id: string }) {
  const making = useMaking();
  const { locale, t } = useLocale();
  const commission = making.get(id);
  const [tab, setTab] = useState<"work" | "audit">("work");

  if (!commission) {
    return (
      <section className="workshop-page section">
        <h1>{t("makingMissing")}</h1>
        <ButtonLink href="/workshop" outline>
          {t("workshopBack")}
        </ButtonLink>
      </section>
    );
  }

  const warning = deadlineWarning(commission);

  return (
    <section className="workshop-page making-detail section">
      <header className="making-heading">
        <span className="eyebrow">{t("workshopEyebrow")}</span>
        <h1>{copy(commission.title, locale)}</h1>
        <p>
          {commission.customerName} · {commission.id}
          {warning ? ` · ${locale === "fa" ? "مهلت نزدیک است" : "Deadline approaching"}` : ""}
        </p>
      </header>
      <SituationBanner commission={commission} />
      <BiographyRail commission={commission} />
      <div className="workshop-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "work"}
          className={tab === "work" ? "active" : ""}
          onClick={() => setTab("work")}
        >
          {locale === "fa" ? "اقدام کارگاه" : "Workshop action"}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "audit"}
          className={tab === "audit" ? "active" : ""}
          onClick={() => setTab("audit")}
        >
          {locale === "fa" ? "رد تصمیم‌ها" : "Decision audit"}
        </button>
      </div>
      {tab === "audit" ? (
        <WorkshopAuditTab commission={commission} />
      ) : (
        <WorkshopWorkTab commission={commission} />
      )}
    </section>
  );
}
