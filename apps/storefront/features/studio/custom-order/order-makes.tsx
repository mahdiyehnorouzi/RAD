"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/components/i18n";
import { ORDER_MAKES, orderCopy } from "../const";
import { StudioIcon, readingArrow } from "../studio-icon";
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
        {ORDER_MAKES.map((make, index) => (
          <li key={make.id} className={index < 2 ? styles.wide : ""}>
            <Link
              href={href(`/studio/start?form=${encodeURIComponent(make.form)}`)}
              className={styles.csMake}
              aria-label={c.makesPick.replace("{name}", make.title[locale])}
            >
              <span className={styles.csMakeArt} aria-hidden="true">
                <Image
                  src={make.image}
                  alt=""
                  fill
                  sizes="(max-width: 700px) 45vw, 22rem"
                />
              </span>
              <span className={styles.csMakeText}>
                <span className={styles.csMakeTitle}>{make.title[locale]}</span>
                <span className={styles.csMakeExamples}>
                  {make.examples[locale]}
                </span>
              </span>
              <span
                className={`${order.csRound} ${styles.csMakeRound}`}
                aria-hidden="true"
              >
                <StudioIcon name={readingArrow(locale, "forward")} size={16} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
