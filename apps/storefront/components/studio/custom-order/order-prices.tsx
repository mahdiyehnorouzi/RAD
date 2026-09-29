"use client";

import Image from "next/image";
import { useLocale } from "@/components/i18n";
import { ORDER_PRICE_TIERS, orderCopy, orderMedia } from "../const";
import { StudioIcon } from "../studio-icon";

export function OrderPrices() {
  const { locale } = useLocale();
  const c = orderCopy[locale];

  return (
    <section id="prices" className="cs-section cs-prices" aria-labelledby="custom-order-prices">
      <div className="cs-prices-intro">
        <header className="cs-head">
          <h2 id="custom-order-prices">{c.pricesTitle}</h2>
          <p>{c.pricesLede}</p>
        </header>
        <figure className="cs-print is-olive">
          <Image {...orderMedia.olive} alt={c.oliveAlt} sizes="(min-width: 960px) 22rem, 60vw" />
        </figure>
      </div>
      <div className="cs-price-body">
        <ul className="cs-price-list">
          {ORDER_PRICE_TIERS.map((tier) => (
            <li key={tier.id}>
              <details className="cs-price">
                <summary>
                  <span className="cs-price-thumb" aria-hidden="true">
                    <Image src={tier.image} alt="" fill sizes="56px" />
                  </span>
                  <span className="cs-price-text">
                    <span className="cs-price-label">{tier.label[locale]}</span>
                    <span className="cs-price-value">{tier.price[locale]}</span>
                  </span>
                  <span className="cs-round" aria-hidden="true">
                    <StudioIcon name="chevron_down" size={16} />
                  </span>
                </summary>
                <p>{tier.examples[locale]}</p>
              </details>
            </li>
          ))}
        </ul>
        <p className="cs-price-note">
          <StudioIcon name="info" size={20} />
          <span>{c.pricesNote}</span>
        </p>
      </div>
    </section>
  );
}
