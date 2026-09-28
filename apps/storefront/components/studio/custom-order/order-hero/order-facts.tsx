"use client";

import { useLocale } from "@/components/i18n";
import { ORDER_FACTS } from "../../const";

export function OrderFacts({ title }: { title: string }) {
  const { locale } = useLocale();

  return (
    <div className="co-facts">
      <h2 id="custom-order-facts">{title}</h2>
      <dl aria-labelledby="custom-order-facts">
        {ORDER_FACTS.map((fact) => (
          <div key={fact.id}>
            <dt>{fact.value[locale]}</dt>
            <dd>{fact.note[locale]}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
