"use client";

import { orderTears } from "../const";
import { OrderHero } from "./order-hero";
import { OrderHow } from "./order-how";
import { OrderMakes } from "./order-makes";
import { OrderPrices } from "./order-prices";
import { OrderTear } from "./order-tear";
import styles from "./custom-order.module.css";

export function CustomOrder() {
  return (
    <div className={styles.customOrder}>
      <OrderHero />
      <OrderHow />

      <div className={`${styles.csBand} ${styles.leaf}`}>
        <OrderTear shape={orderTears.band} className={styles.csTearTop} />
        <OrderMakes />
        <OrderTear shape={orderTears.band} className={styles.csTearBottom} />
      </div>

      <OrderPrices />
    </div>
  );
}
