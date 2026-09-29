"use client";

import { useLocale } from "@/components/i18n";
import { CustomDesigner, useDesigner } from "../custom-designer";
import { orderCopy, orderTears, type OrderMake } from "../const";
import { OrderHero } from "./order-hero";
import { OrderHow } from "./order-how";
import { OrderMakes } from "./order-makes";
import { OrderPrices } from "./order-prices";
import { OrderTear } from "./order-tear";
import "./custom-order.css";

export function CustomOrder() {
  const { locale } = useLocale();
  const c = orderCopy[locale];
  const designer = useDesigner();

  function pick(make: OrderMake) {
    designer.preselect(make.form, make.use);
    document.getElementById("your-idea")?.scrollIntoView({ block: "start" });
  }

  return (
    <div className="custom-order">
      <OrderHero />
      <OrderHow />

      <div className="cs-band is-leaf">
        <OrderTear shape={orderTears.band} className="cs-tear-top" />
        <OrderMakes onPick={pick} />
        <OrderTear shape={orderTears.band} className="cs-tear-bottom" />
      </div>

      <OrderPrices />

      <div className="cs-band is-plaster">
        <OrderTear shape={orderTears.band} className="cs-tear-top" />
        <section id="your-idea" className="cs-section cs-flow" aria-labelledby="custom-order-flow">
          <div className="cs-flow-sheet">
            <header className="cs-head">
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
