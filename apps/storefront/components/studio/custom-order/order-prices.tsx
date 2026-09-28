"use client";

import { useLocale } from "@/components/i18n";
import { ORDER_PRICE_TIERS, orderCopy } from "../const";

export function OrderPrices() {
  const { locale } = useLocale();
  const c = orderCopy[locale];
  const lastId = ORDER_PRICE_TIERS[ORDER_PRICE_TIERS.length - 1]?.id;

  return (
    <section
      id="prices"
      className="co-section co-prices"
      aria-labelledby="custom-order-prices"
    >
      <div className="co-inner co-prices-grid">
        <div className="co-prices-copy">
          <h2 id="custom-order-prices">{c.pricesTitle}</h2>
          <p>{c.pricesLede}</p>
        </div>
        <div className="co-prices-table">
          <table>
            <thead>
              <tr>
                <th scope="col">{c.pricesTypeHead}</th>
                <th scope="col">{c.pricesStartHead}</th>
              </tr>
            </thead>
            <tbody>
              {ORDER_PRICE_TIERS.map((tier) => (
                <tr key={tier.id} className={tier.id === lastId ? "is-review" : ""}>
                  <th scope="row">
                    <span>{tier.label[locale]}</span>
                    <small>{tier.examples[locale]}</small>
                  </th>
                  <td>{tier.price[locale]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="co-prices-note">{c.pricesDisclaimer}</p>
        </div>
      </div>
    </section>
  );
}
