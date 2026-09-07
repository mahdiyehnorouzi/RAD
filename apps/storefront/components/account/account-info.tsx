"use client";

import { useCommerce } from "@/components/commerce";
import { useLocale } from "@/components/i18n";
import { AccountShell } from "./account-shell";
import "./account-info.css";

export function AccountInfoPage() {
  const { user, logout } = useCommerce();
  const { t } = useLocale();

  return (
    <AccountShell requireAuth>
      {user ? (
        <section className="account-info section">
          <header>
            <span className="eyebrow">{t("accountInfoEyebrow")}</span>
            <h1>{t("accountInfo")}</h1>
            <p>{t("accountInfoBody")}</p>
          </header>
          <dl className="account-info-fields">
            <div>
              <dt>{t("nameLabel")}</dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt>{t("emailLabel")}</dt>
              <dd dir="ltr">{user.email}</dd>
            </div>
          </dl>
          <button type="button" className="button outline" onClick={logout}>
            {t("logout")}
          </button>
        </section>
      ) : null}
    </AccountShell>
  );
}
