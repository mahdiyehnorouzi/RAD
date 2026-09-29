"use client";

import { useLocale } from "@/components/i18n";
import { StudioIcon, type StudioIconName } from "../../studio-icon";
import { ORDER_RULES, type OrderRule } from "../../const";

const icons: Record<OrderRule["id"], StudioIconName> = {
  changes: "edit",
  kiln: "palette",
  cancel: "info",
};

export function ReviewRules() {
  const { locale } = useLocale();

  return (
    <div className="review-rules">
      {ORDER_RULES.map((rule) => (
        <details key={rule.id} className="review-rule">
          <summary>
            <span className="review-rule-icon" aria-hidden="true">
              <StudioIcon name={icons[rule.id]} size={17} />
            </span>
            <span className="review-rule-text">
              <strong>{rule.title[locale]}</strong>
              <span>{rule.brief[locale]}</span>
            </span>
            <StudioIcon name="chevron_down" size={16} className="review-rule-chevron" />
          </summary>
          {rule.body.map((line) => (
            <p key={line.en}>{line[locale]}</p>
          ))}
        </details>
      ))}
    </div>
  );
}
