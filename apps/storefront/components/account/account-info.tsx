"use client";

import { LogOut, Mail, UserRound } from "lucide-react";
import { useCommerce } from "@/components/commerce";
import { useLocale } from "@/components/i18n";
import { AccountShell } from "./account-shell";
import { AccountHeading } from "./account-heading";
import "./account-info.css";

export function AccountInfoPage() {
  const { user, logout } = useCommerce();
  const { t } = useLocale();

  return (
    <AccountShell requireAuth>
      {user ? (
        <section className="account-info section">
          <AccountHeading icon={UserRound} title={t("accountInfo")} body={t("accountInfoBody")} />
          <dl className="account-list account-info-fields">
            <div>
              <UserRound className="account-info-icon" aria-hidden="true" strokeWidth={1.6} />
              <div>
                <dt>{t("nameLabel")}</dt>
                <dd>{user.name}</dd>
              </div>
            </div>
            <div>
              <Mail className="account-info-icon" aria-hidden="true" strokeWidth={1.6} />
              <div>
                <dt>{t("emailLabel")}</dt>
                <dd>
                  <span dir="ltr">{user.email}</span>
                </dd>
              </div>
            </div>
          </dl>
          <button type="button" className="account-button account-button--oxide account-info-logout" onClick={logout}>
            <LogOut aria-hidden="true" strokeWidth={1.6} />
            {t("logout")}
          </button>
        </section>
      ) : null}
    </AccountShell>
  );
}
