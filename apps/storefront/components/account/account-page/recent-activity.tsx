"use client";

import Link from "next/link";
import { useLocale } from "@/components/i18n";
import { useAccountActivity } from "../hooks";
import "./recent-activity.css";

export function RecentActivity() {
  const { t, href } = useLocale();
  const items = useAccountActivity();

  return (
    <section className="recent-activity">
      <header>
        <span className="eyebrow">{t("profileEyebrow")}</span>
        <h2>{t("recentActivity")}</h2>
      </header>
      {items.length ? (
        <ul className="activity-list">
          {items.map((item) => (
            <li key={item.id}>
              <Link className="activity-card" href={href(item.href)}>
                <h3>{item.title}</h3>
                <span className="activity-type">
                  {item.kind === "collection"
                    ? t("collectionPurchase")
                    : t("customOrderType")}
                </span>
                <span className="activity-status">{item.status}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="activity-empty">{t("noRecentActivity")}</p>
      )}
    </section>
  );
}
