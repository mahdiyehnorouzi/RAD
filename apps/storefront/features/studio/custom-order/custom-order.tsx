"use client";

import { useLocale } from "@/components/i18n";
import { CustomDesigner, useDesigner } from "../custom-designer";
import { orderCopy, orderTears, type OrderMake } from "../const";
import { OrderHero } from "./order-hero";
import { OrderHow } from "./order-how";
import { OrderMakes } from "./order-makes";
import { OrderPrices } from "./order-prices";
import { OrderTear } from "./order-tear";
import styles from "./custom-order.module.css";

export function CustomOrder() {
  const { locale } = useLocale();
  const c = orderCopy[locale];
  const designer = useDesigner();

  function pick(make: OrderMake) {
    designer.preselect(make.form, make.use);
    document.getElementById("your-idea")?.scrollIntoView({ block: "start" });
  }

  return (
    <div className={styles.customOrder}>
      <OrderHero />
      <OrderHow />

      <div className={`${styles.csBand} ${styles.leaf}`}>
        <OrderTear shape={orderTears.band} className={styles.csTearTop} />
        <OrderMakes onPick={pick} />
        <OrderTear shape={orderTears.band} className={styles.csTearBottom} />
      </div>

      <OrderPrices />

      <div className={`${styles.csBand} ${styles.plaster}`}>
        <OrderTear shape={orderTears.band} className={styles.csTearTop} />
        <section
          id="your-idea"
          className={`${styles.csSection} ${styles.csFlow}`}
          aria-labelledby="custom-order-flow"
        >
          <div className={styles.csFlowSheet}>
            <header className={styles.csHead}>
              <h2 id="custom-order-flow">{c.flowTitle}</h2>
              <p>{c.flowLede}</p>
            </header>
            <CustomDesigner designer={designer} />
          </div>
        </section>
      </div>
    </div>
  );
}
