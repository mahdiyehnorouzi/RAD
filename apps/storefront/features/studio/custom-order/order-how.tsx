"use client";

import Image from "next/image";
import { useLocale } from "@/components/i18n";
import {
  ORDER_OVERVIEW,
  orderCopy,
  orderMedia,
  type OrderOverviewStep,
} from "../const";
import { StudioIcon, readingArrow, type StudioIconName } from "../studio-icon";
import styles from "./order-how.module.css";
import order from "./custom-order.module.css";
import btn from "../studio-btn.module.css";

const icons: Record<OrderOverviewStep["id"], StudioIconName> = {
  idea: "sparkles",
  review: "search",
  quote: "document",
  making: "tools",
};

export function OrderHow() {
  const { locale } = useLocale();
  const c = orderCopy[locale];

  return (
    <section
      className={`${order.csSection} ${styles.csHow}`}
      aria-labelledby="custom-order-steps"
    >
      <div>
        <header className={order.csHead}>
          <h2 id="custom-order-steps">{c.stepsTitle}</h2>
          <p>{c.stepsLede}</p>
        </header>
        <ol className={styles.csHowSteps}>
          {ORDER_OVERVIEW.map((step) => (
            <li key={step.id}>
              <span className={styles.csHowIcon} aria-hidden="true">
                <StudioIcon name={icons[step.id]} size={22} />
              </span>
              <span className={styles.csHowCopy}>
                <strong>{step.title[locale]}</strong>
                <span>{step.note[locale]}</span>
              </span>
            </li>
          ))}
        </ol>
        <a
          className={`${btn.csBtn} ${btn.csBtnSolid} ${styles.csHowCta}`}
          href="#your-idea"
        >
          <span>{c.stepsCta}</span>
          <StudioIcon name={readingArrow(locale, "forward")} size={20} />
        </a>
      </div>

      <figure className={styles.csHowPair}>
        <span
          className={`${order.csPrint} ${styles.csHowPrint} ${styles.sketch}`}
        >
          <Image
            {...orderMedia.sketch}
            alt={c.sketchAlt}
            sizes="(min-width: 960px) 26rem, 72vw"
          />
        </span>
        <svg
          className={`${order.csThread} ${styles.csHowThread}`}
          viewBox="0 0 200 60"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <path
            pathLength={1}
            d="M56 0C54 22 82 30 100 28c14-2 16-14 6-16s-14 12-4 20c14 12 40 6 42 28"
          />
        </svg>
        <figcaption className={styles.csHowHand}>{c.pairHand}</figcaption>
        <span
          className={`${order.csPrint} ${styles.csHowPrint} ${styles.bowl}`}
        >
          <Image
            {...orderMedia.bowl}
            alt={c.bowlAlt}
            sizes="(min-width: 960px) 26rem, 72vw"
          />
        </span>
      </figure>
    </section>
  );
}
