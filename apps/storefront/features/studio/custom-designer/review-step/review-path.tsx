"use client";

import { useLocale } from "@/components/i18n";
import { ORDER_PATH } from "../../const";
import styles from "./review-path.module.css";

export function ReviewPath({ labelledBy }: { labelledBy: string }) {
  const { locale, number } = useLocale();

  return (
    <ol className={styles.reviewPath} aria-labelledby={labelledBy}>
      {ORDER_PATH.map((step, index) => (
        <li key={step.id}>
          <span className={styles.reviewPathDot} aria-hidden="true">
            {number(index + 1)}
          </span>
          <strong>{step.title[locale]}</strong>
          <span>{step.short[locale]}</span>
        </li>
      ))}
    </ol>
  );
}
