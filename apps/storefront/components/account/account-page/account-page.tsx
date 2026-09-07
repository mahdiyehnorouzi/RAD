"use client";

import { useCommerce } from "@/components/commerce";
import { useLocale } from "@/components/i18n";
import { AccountShell } from "../account-shell";
import { AccountLogin } from "./account-login";
import { RecentActivity } from "./recent-activity";
import "./account-page.css";

export function AccountPage() {
  const { user } = useCommerce();
  const { locale, t } = useLocale();
  const pageTitle = locale === "fa" ? "حساب کاربری | رَد" : "Account | RAD";

  if (!user) return <AccountLogin />;

  return (
    <AccountShell>
      <title>{pageTitle}</title>
      <section className="profile-page section">
        <header className="profile-hero">
          <div className="profile-identity">
            <span className="profile-avatar" aria-hidden="true">
              {user.name.trim().charAt(0)}
            </span>
            <div>
              <span className="eyebrow">{t("accountOverview")}</span>
              <h1>
                {t("hello")} {user.name}
              </h1>
              <p>{user.email}</p>
            </div>
          </div>
        </header>
        <RecentActivity />
      </section>
    </AccountShell>
  );
}
