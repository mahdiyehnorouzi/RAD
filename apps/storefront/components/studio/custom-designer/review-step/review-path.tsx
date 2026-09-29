"use client";

import { useLocale } from "@/components/i18n";
import { ORDER_PATH } from "../../const";

export function ReviewPath({ labelledBy }: { labelledBy: string }) {
  const { locale, number } = useLocale();

  return (
    <ol className="review-path" aria-labelledby={labelledBy}>
      {ORDER_PATH.map((step, index) => (
        <li key={step.id}>
          <span className="review-path-dot" aria-hidden="true">
            {number(index + 1)}
          </span>
          <strong>{step.title[locale]}</strong>
          <span>{step.short[locale]}</span>
        </li>
      ))}
    </ol>
  );
}
