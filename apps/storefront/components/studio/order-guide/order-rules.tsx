"use client";

import { useLocale } from "@/components/i18n";
import { ORDER_RULES } from "../const";
import "./order-guide.css";

/** Full rules on the page; `briefOnly` keeps just the lines repeated before sending. */
export function OrderRules({ briefOnly = false }: { briefOnly?: boolean }) {
  const { locale } = useLocale();
  const rules = briefOnly ? ORDER_RULES.filter((rule) => rule.brief) : ORDER_RULES;

  return (
    <dl className={`order-rules${briefOnly ? " is-brief" : ""}`}>
      {rules.map((rule) => (
        <div key={rule.id}>
          <dt>{rule.title[locale]}</dt>
          {briefOnly && rule.brief ? (
            <dd>{rule.brief[locale]}</dd>
          ) : (
            rule.body.map((line) => <dd key={line.en}>{line[locale]}</dd>)
          )}
        </div>
      ))}
    </dl>
  );
}
