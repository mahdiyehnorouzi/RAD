"use client";

import { useCommerce } from "@/components/commerce";
import { useLocale } from "@/components/i18n";
import { AccountShell } from "../account-shell";
import { AccountLogin } from "./account-login";
import { AccountBanner } from "./account-banner";
import { AccountMenu } from "./account-menu";
import { Collection } from "../collection";
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
      <section className="account-hub section">
        <header className="account-hub-greeting">
          <span className="account-hub-avatar" aria-hidden="true">
            {user.name.trim().charAt(0)}
          </span>
          <div>
            <h1>
              {t("hello")} {user.name}
            </h1>
            <p>
              <span dir="ltr">{user.email}</span>
            </p>
          </div>
        </header>
        <AccountBanner />
        <AccountMenu />
        <div className="account-hub-records">
          <Collection />
          <RecentActivity />
        </div>
      </section>
    </AccountShell>
  );
}
