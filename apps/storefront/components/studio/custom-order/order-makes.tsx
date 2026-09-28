"use client";

import Image from "next/image";
import { useLocale } from "@/components/i18n";
import { ORDER_MAKES, orderCopy } from "../const";

function OpenIdeaMark() {
  return (
    <svg
      className="co-make-open"
      viewBox="0 0 160 120"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path
        d="M38 70c-10-28 16-50 44-44 20-12 50 2 46 26 16 14 4 42-20 38-14 14-44 12-52-2-20 4-30-8-18-18z"
        strokeDasharray="5 6"
      />
      <path d="M68 58c4-10 22-10 24 0 2 9-12 10-12 20" />
      <path d="M80 88v1" strokeWidth={2.4} />
    </svg>
  );
}

export function OrderMakes() {
  const { locale } = useLocale();
  const c = orderCopy[locale];

  return (
    <section className="co-section co-makes" aria-labelledby="custom-order-makes">
      <div className="co-inner">
        <h2 id="custom-order-makes">{c.makesTitle}</h2>
        <ul className="co-make-grid">
          {ORDER_MAKES.map((make) => (
            <li key={make.id} className={make.image ? "" : "is-open"}>
              <div className="co-make-plate">
                {make.image ? (
                  <Image
                    src={make.image}
                    alt=""
                    fill
                    sizes="(max-width: 600px) 45vw, (max-width: 900px) 30vw, 22vw"
                  />
                ) : (
                  <OpenIdeaMark />
                )}
              </div>
              <h3>{make.title[locale]}</h3>
              <p>{make.examples[locale]}</p>
            </li>
          ))}
        </ul>
        <div className="co-makes-closing">
          <p className="co-makes-closing-title">{c.makesClosingTitle}</p>
          <p>{c.makesClosingBody}</p>
        </div>
      </div>
    </section>
  );
}
