"use client";
import "./customer-list.css";

import { isDemoCommission, seedCommissions } from "@/lib/making";
import { useMaking } from "@/hooks/use-making-workspace";
import { useLocale } from "@/components/i18n";
import { ButtonLink } from "@/components/ui/button-link";
import Image from "next/image";
import { PenLine } from "lucide-react";
import { AccountShell } from "../../account/account-shell";
import { AccountHeading } from "../../account/account-heading";
import { CommissionCard } from "./commission-card";
import { CardListSkeleton } from "@/components/ui/skeleton";

export function CustomerMakingList() {
  const { commissions, ready } = useMaking();
  const { t } = useLocale();
  const mine = commissions.filter((item) => !isDemoCommission(item.id));
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
      <AccountHeading icon={PenLine} title={t("customOrdersTitle")} body={t("customOrdersBody")} />
      <aside className="making-note">
        <p>{t("makingCustomNote")}</p>
        <Image src="/contact/contact-sprig.webp" alt="" width={108} height={116} />
      </aside>
      {mine.length ? (
        <div className="making-grid">
          {mine.map((item) => (
            <CommissionCard key={item.id} commission={item} hrefBase="/making" />
          ))}
        </div>
      ) : (
        <div className="account-empty making-empty">
          <h2>{t("makingEmpty")}</h2>
          <p>{t("makingEmptyBody")}</p>
          <ButtonLink href="/studio">{t("startCustomOrder")}</ButtonLink>
        </div>
      )}
      <section className="making-sample">
        <header className="making-heading">
          <h2>{t("customOrdersSampleTitle")}</h2>
          <p>{t("customOrdersSampleBody")}</p>
        </header>
        <div className="making-grid">
          {seedCommissions.map((item) => (
            <CommissionCard key={item.id} commission={item} hrefBase="/making" />
          ))}
        </div>
      </section>
    </section>
    </AccountShell>
  );
}
