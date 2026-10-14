"use client";

import { useLocale } from "@/components/i18n";
import { ORDER_STEPS, orderCopy, type OrderStep } from "../const";
import { StudioIcon, type StudioIconName } from "../studio-icon";
import { useInView } from "../use-in-view";
import styles from "./order-how.module.css";
import order from "./custom-order.module.css";

const icons: Record<OrderStep["id"], StudioIconName> = {
  idea: "sparkles",
  design: "palette",
  making: "truck",
};

export function OrderHow() {
  const { locale } = useLocale();
  const c = orderCopy[locale];
  const { ref, inView } = useInView<HTMLOListElement>();

  return (
    <section
      className={`${order.csSection} ${styles.csHow}`}
      aria-labelledby="custom-order-steps"
    >
      <header className={order.csHead}>
        <h2 id="custom-order-steps">{c.stepsTitle}</h2>
        <p>{c.stepsLede}</p>
      </header>
      <ol
        ref={ref}
        className={styles.csHowSteps}
        data-in-view={inView || undefined}
      >
        {ORDER_STEPS.map((step, index) => (
          <li
            key={step.id}
            className={styles.csHowStep}
            style={{ "--cs-i": index } as React.CSSProperties}
          >
            <span className={styles.csHowIcon} aria-hidden="true">
              <StudioIcon name={icons[step.id]} size={18} />
            </span>
            <strong>{step.title[locale]}</strong>
            <span>{step.note[locale]}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
