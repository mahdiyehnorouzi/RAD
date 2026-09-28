"use client";

import { CURRENT_POLICY_VERSIONS, type PolicySlug } from "@rad/types";
import { policyTitleLabels, type AdminOrder } from "../lib/admin-data";

const STOREFRONT_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://www.rad-object.com";

const day = (id: string) =>
  new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(`${id}T12:00:00Z`),
  );
const dateTime = (value: number) =>
  new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(value);

function policyUrl(slug: PolicySlug, version: string) {
  const path = CURRENT_POLICY_VERSIONS[slug] === version ? `/help/${slug}` : `/help/${slug}/v/${version}`;
  return new URL(path, STOREFRONT_URL).toString();
}

/** Which rule versions this order was placed under, and when they were accepted. */
export function AdminOrderPolicies({ order }: { order: AdminOrder }) {
  const acceptance = order.policyAcceptance;

  return (
    <section className="order-policies">
      <h4>
        قوانین پذیرفته‌شده
        {acceptance ? <span>{dateTime(acceptance.acceptedAt)}</span> : null}
      </h4>
      {acceptance ? (
        <ul>
          {(Object.entries(acceptance.versions) as [PolicySlug, string][]).map(([slug, version]) => (
            <li key={slug}>
              <a href={policyUrl(slug, version)} target="_blank" rel="noopener noreferrer">
                {policyTitleLabels[slug]}
              </a>
              <small>نسخه‌ی {day(version)}</small>
            </li>
          ))}
        </ul>
      ) : (
        <p>این سفارش پیش از ثبت نسخه‌ی قوانین ثبت شده است.</p>
      )}
    </section>
  );
}
