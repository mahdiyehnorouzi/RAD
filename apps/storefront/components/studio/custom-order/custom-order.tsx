"use client";

import { useLocale } from "@/components/i18n";
import { ButtonLink } from "@/components/ui/button-link";
import { CustomDesigner } from "../custom-designer";
import { OrderPath, OrderRules } from "../order-guide";
import { orderCopy } from "../const";
import { OrderHero } from "./order-hero";
import { OrderMakes } from "./order-makes";
import { OrderPrices } from "./order-prices";
import "./custom-order.css";

export function CustomOrder() {
  const { locale } = useLocale();
  const c = orderCopy[locale];

  return (
    <div className="custom-order">
      <OrderHero />
      <OrderMakes />
      <OrderPrices />

      <section className="co-section co-path" aria-labelledby="custom-order-path">
        <div className="co-inner">
          <header className="co-heading">
            <h2 id="custom-order-path">{c.pathTitle}</h2>
            <p>{c.pathLede}</p>
          </header>
          <OrderPath labelledBy="custom-order-path" />
        </div>
      </section>

      <section id="rules" className="co-section co-rules" aria-labelledby="custom-order-rules">
        <div className="co-inner">
          <h2 id="custom-order-rules">{c.rulesTitle}</h2>
          <OrderRules />
        </div>
      </section>

      <section id="your-idea" className="studio-page co-section co-form">
        <CustomDesigner title={c.formTitle} />
      </section>

      <section className="co-section co-closing" aria-labelledby="custom-order-closing">
        <div className="co-inner co-closing-inner">
          <div>
            <h2 id="custom-order-closing">{c.closingTitle}</h2>
            <p>{c.closingBody}</p>
          </div>
          <ButtonLink href="/differences" outline>
            {c.closingCta}
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
