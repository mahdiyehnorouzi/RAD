"use client";
import "./customer-list.css";

import { useMaking } from "@/hooks/use-making-workspace";
import { useLocale } from "@/components/i18n";
import { ButtonLink } from "@/components/ui/button-link";
import { AccountShell } from "../../account/account-shell";
import { CommissionCard } from "./commission-card";

export function CustomerMakingList() {
  const { commissions, ready } = useMaking();
  const { locale, t } = useLocale();
  if (!ready) {
    return (
      <AccountShell>
        <section className="making-page section">
          <p>{locale === "fa" ? "در حال خواندن مسیرها…" : "Reading making paths…"}</p>
        </section>
      </AccountShell>
    );
  }
  return (
    <AccountShell>
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
          <ButtonLink href="/studio">{t("designMine")}</ButtonLink>
        </div>
      )}
    </section>
    </AccountShell>
  );
}
