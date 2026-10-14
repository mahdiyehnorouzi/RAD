"use client";

import { Lightbulb, SlidersHorizontal, UserRound } from "lucide-react";
import { useLocale } from "@/components/i18n";
import type { OrderPhase } from "./type/order-phase";
import styles from "./order-progress.module.css";

const PHASES: OrderPhase[] = ["idea", "choices", "review"];
const ICONS = [Lightbulb, SlidersHorizontal, UserRound];

export function OrderProgress({ phase }: { phase: OrderPhase }) {
  const { locale } = useLocale();
  const fa = locale === "fa";
  const txt = (faText: string, en: string) => (fa ? faText : en);
  const index = PHASES.indexOf(phase);
  const labels = [txt("ایده", "Idea"), txt("انتخاب‌ها", "Choices"), txt("بررسی", "Review")];

  return (
    <ol className={styles.progress} aria-label={txt("مراحل سفارش", "Order stages")}>
      {PHASES.map((p, i) => {
        const Icon = ICONS[i];
        return (
          <li
            key={p}
            data-current={index === i}
            data-done={index > i}
            aria-current={index === i ? "step" : undefined}
          >
            <Icon aria-hidden="true" />
            <span>{labels[i]}</span>
          </li>
        );
      })}
    </ol>
  );
}
