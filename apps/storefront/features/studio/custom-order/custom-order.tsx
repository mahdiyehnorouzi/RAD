"use client";

import { OrderHero } from "./order-hero";
import { OrderHow } from "./order-how";
import { OrderMakes } from "./order-makes";
import { OrderSamples } from "./order-samples";
import { OrderCta } from "./order-cta";
import styles from "./custom-order.module.css";

export function CustomOrder() {
  return (
    <div className={styles.customOrder}>
      {/* Shared organic clip-path used by the hero photo; objectBoundingBox so it scales with the element. */}
      <svg width="0" height="0" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id="cs-hero-blob" clipPathUnits="objectBoundingBox">
            <path
              d="M0.09,0.02 C0.32,-0.01 0.58,0.01 0.78,0.03
                 C0.95,0.05 1,0.14 0.99,0.27
                 C0.98,0.42 1,0.5 1,0.63
                 C1,0.8 0.97,0.9 0.83,0.95
                 C0.66,1.01 0.38,1 0.21,0.96
                 C0.07,0.93 0.01,0.82 0.02,0.67
                 C0.03,0.52 0,0.42 0.01,0.27
                 C0.02,0.12 -0.01,0.05 0.09,0.02 Z"
            />
          </clipPath>
        </defs>
      </svg>

      <OrderHero />
      <OrderHow />
      <OrderMakes />
      <OrderSamples />
      <OrderCta />
    </div>
  );
}
