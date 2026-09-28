"use client";

import { useLocale } from "@/components/i18n";
import { ORDER_PATH } from "../const";
import "./order-guide.css";

export function OrderPath({
  compact = false,
  labelledBy,
}: {
  compact?: boolean;
  labelledBy?: string;
}) {
  const { locale, number } = useLocale();
  const pad = (value: number) =>
    number(value).padStart(2, locale === "fa" ? "۰" : "0");

  return (
    <ol
      className={`order-path${compact ? " is-compact" : ""}`}
      aria-labelledby={labelledBy}
    >
      {ORDER_PATH.map((step, index) => (
        <li key={step.id}>
          <span className="order-path-index" aria-hidden="true">
            {pad(index + 1)}
          </span>
          <strong>{step.title[locale]}</strong>
          <p>{step.body[locale]}</p>
        </li>
      ))}
    </ol>
  );
}
