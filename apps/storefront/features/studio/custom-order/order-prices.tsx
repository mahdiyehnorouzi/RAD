"use client";

import Image from "next/image";
import { useLocale } from "@/components/i18n";
import { ORDER_PRICE_TIERS, orderCopy, orderMedia } from "../const";
import { StudioIcon } from "../studio-icon";
import styles from "./order-prices.module.css";
import order from "./custom-order.module.css";

export function OrderPrices() {
  const { locale } = useLocale();
  const c = orderCopy[locale];

  return (
    <section
      id="prices"
      className={`${order.csSection} ${styles.csPrices}`}
      aria-labelledby="custom-order-prices"
    >
      <div className={styles.csPricesIntro}>
        <header className={order.csHead}>
          <h2 id="custom-order-prices">{c.pricesTitle}</h2>
          <p>{c.pricesLede}</p>
        </header>
        <figure className={`${order.csPrint} ${styles.olive}`}>
          <Image
            {...orderMedia.olive}
            alt={c.oliveAlt}
            sizes="(min-width: 960px) 22rem, 60vw"
          />
        </figure>
      </div>
      <div>
        <ul className={styles.csPriceList}>
          {ORDER_PRICE_TIERS.map((tier) => (
            <li key={tier.id}>
              <details className={styles.csPrice}>
                <summary>
                  <span className={styles.csPriceThumb} aria-hidden="true">
                    <Image src={tier.image} alt="" fill sizes="56px" />
                  </span>
                  <span className={styles.csPriceText}>
                    <span className={styles.csPriceLabel}>
                      {tier.label[locale]}
                    </span>
                    <span className={styles.csPriceValue}>
                      {tier.price[locale]}
                    </span>
                  </span>
                  <span
                    className={`${order.csRound} ${styles.csPriceRound}`}
                    aria-hidden="true"
                  >
                    <StudioIcon name="chevron_down" size={16} />
                  </span>
                </summary>
                <p>{tier.examples[locale]}</p>
              </details>
            </li>
          ))}
        </ul>
        <p className={styles.csPriceNote}>
          <StudioIcon name="info" size={20} />
          <span>{c.pricesNote}</span>
        </p>
      </div>
    </section>
  );
}
