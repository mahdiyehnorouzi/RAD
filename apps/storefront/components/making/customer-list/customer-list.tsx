"use client";
import "./customer-list.css";

import { useMaking } from "@/hooks/use-making-workspace";
import { useLocale } from "@/components/i18n";
import { ButtonLink } from "@/components/ui/button-link";
import { AccountShell } from "../../account/account-shell";
import { CommissionCard } from "./commission-card";
import { CardListSkeleton } from "@/components/ui/skeleton";

export function CustomerMakingList() {
  const { commissions, ready } = useMaking();
  const { t } = useLocale();
  if (!ready) {
    return (
      <AccountShell requireAuth>
        <section className="making-page section">
          <CardListSkeleton count={4} className="making-grid" />
        </section>
      </AccountShell>
    );
  }
  return (
    <AccountShell requireAuth>
    <section className="making-page section">
      <header className="making-heading">
        <span className="eyebrow">{t("customOrdersEyebrow")}</span>
        <h1>{t("customOrdersTitle")}</h1>
        <div className="making-heading-copy">
          <p>{t("makingCustomNote")}</p>
          <p>{t("customOrdersBody")}</p>
        </div>
      </header>
      {commissions.length ? (
        <div className="making-grid">
          {commissions.map((item) => (
            <CommissionCard key={item.id} commission={item} hrefBase="/making" />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>{t("makingEmpty")}</h2>
          <p>{t("makingEmptyBody")}</p>
          <ButtonLink href="/studio">{t("startCustomOrder")}</ButtonLink>
        </div>
      )}
    </section>
    </AccountShell>
  );
}
