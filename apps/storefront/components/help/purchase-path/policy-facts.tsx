"use client";

import type { PolicySlug } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { helpCopy, policyPoint } from "../const";

export type PolicyFactRef = {
  slug: PolicySlug;
  id: string;
  /** Mark the line as still under legal review. */
  review?: boolean;
};

/** "In short" lines quoted from the current policy texts. */
export function PolicyFacts({ facts }: { facts: PolicyFactRef[] }) {
  const { locale } = useLocale();

  return (
    <dl className="policy-facts">
      {facts.map((fact) => {
        const point = policyPoint(fact.slug, fact.id);
        return (
          <div key={`${fact.slug}-${fact.id}`}>
            <dt>{point.label[locale]}</dt>
            <dd>
              {point.value[locale]}
              {fact.review ? (
                <small className="policy-facts-review">
                  {helpCopy[locale].underReview}
                </small>
              ) : null}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
