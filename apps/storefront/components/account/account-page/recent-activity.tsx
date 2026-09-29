"use client";

import Link from "next/link";
import { History } from "lucide-react";
import { useLocale } from "@/components/i18n";
import { useAccountActivity } from "../hooks";
import { useMaking } from "@/hooks/use-making-workspace";
import { CardListSkeleton } from "@/components/ui/skeleton";
import { AccountHeading } from "../account-heading";
import "./recent-activity.css";

export function RecentActivity() {
  const { t, href } = useLocale();
  const items = useAccountActivity();
  const { ready } = useMaking();

  return (
    <section className="recent-activity" aria-labelledby="recent-activity-title">
      <AccountHeading as="h2" id="recent-activity-title" icon={History} title={t("recentActivity")} />
      {!ready ? (
        <CardListSkeleton count={3} />
      ) : items.length ? (
        <ul className="account-list">
          {items.map((item) => (
            <li key={item.id}>
              <Link className="activity-row" href={href(item.href)}>
                <span className="activity-copy">
                  <small>
                    {item.kind === "collection"
                      ? t("collectionPurchase")
                      : t("customOrderType")}
                  </small>
                  <b>{item.title}</b>
                </span>
                <span className="activity-status">{item.status}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="account-empty">
          <p>{t("noRecentActivity")}</p>
        </div>
      )}
    </section>
  );
}
