"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/components/i18n";
import { ORDER_CATEGORIES, orderCopy } from "../const";
import { StudioIcon } from "../studio-icon";
import styles from "./order-makes.module.css";
import order from "./custom-order.module.css";

export function OrderMakes() {
  const { locale, href } = useLocale();
  const c = orderCopy[locale];

  return (
    <section
      className={`${order.csSection} ${styles.csMakes}`}
      aria-labelledby="custom-order-makes"
    >
      <header className={order.csHead}>
        <h2 id="custom-order-makes">{c.makesTitle}</h2>
        <p>{c.makesLede}</p>
      </header>
      <ul className={styles.csMakeGrid}>
        {ORDER_CATEGORIES.map((category) => (
          <li key={category.id}>
            <Link
              href={href(
                `/studio/start?form=${encodeURIComponent(category.form)}`,
              )}
              className={styles.csMake}
              aria-label={c.makesPick.replace("{name}", category.title[locale])}
            >
              <span className={styles.csMakeArt} aria-hidden="true">
                <Image
                  src={category.image.src}
                  alt=""
                  fill
                  sizes="(max-width: 700px) 60vw, 22rem"
                />
              </span>
              <span className={styles.csMakeText}>
                <span className={styles.csMakeTitle}>
                  {category.title[locale]}
                </span>
                <span className={styles.csMakeExamples}>
                  {category.examples[locale]}
                </span>
              </span>
              <span
                className={`${order.csRound} ${styles.csMakeRound}`}
                aria-hidden="true"
              >
                <StudioIcon name="arrow_left" size={16} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
