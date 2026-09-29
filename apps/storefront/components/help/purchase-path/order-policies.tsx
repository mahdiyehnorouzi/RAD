"use client";
import "./purchase-path.css";

import Link from "next/link";
import { FileText } from "lucide-react";
import type { PolicyAcceptance, PolicySlug } from "@rad/types";
import { useLocale } from "@/components/i18n";
import {
  formatPolicyDate,
  policyDocument,
  policyVersionPath,
  purchasePathCopy,
} from "../const";

/** The exact rule versions this order was placed under, each still readable. */
export function OrderPolicies({
  acceptance,
}: {
  acceptance: PolicyAcceptance;
}) {
  const { locale, href } = useLocale();
  const c = purchasePathCopy[locale];
  const entries = Object.entries(acceptance.versions) as [PolicySlug, string][];
  if (!entries.length) return null;

  const acceptedOn = new Intl.DateTimeFormat(
    locale === "fa" ? "fa-IR" : "en-GB",
    {
      dateStyle: "long",
    },
  ).format(new Date(acceptance.acceptedAt));

  return (
    <section className="order-policies" aria-labelledby="order-policies-title">
      <h2 id="order-policies-title">{c.acceptedTitle}</h2>
      <p>{c.acceptedBody.replace("{date}", acceptedOn)}</p>
      <ul>
        {entries.map(([slug, version]) => {
          const doc = policyDocument(slug);
          if (!doc) return null;
          return (
            <li key={slug}>
              <Link href={href(policyVersionPath(slug, version))}>
                <FileText aria-hidden="true" />
                <span>{doc.title[locale]}</span>
              </Link>
              <time dateTime={version}>
                {formatPolicyDate(version, locale)}
              </time>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
