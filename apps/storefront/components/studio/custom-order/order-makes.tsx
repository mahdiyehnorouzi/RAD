"use client";

import Image from "next/image";
import { useLocale } from "@/components/i18n";
import { ORDER_MAKES, orderCopy, type OrderMake } from "../const";
import { StudioIcon, readingArrow } from "../studio-icon";

export function OrderMakes({ onPick }: { onPick: (make: OrderMake) => void }) {
  const { locale } = useLocale();
  const c = orderCopy[locale];

  return (
    <section className="cs-section cs-makes" aria-labelledby="custom-order-makes">
      <header className="cs-head">
        <h2 id="custom-order-makes">{c.makesTitle}</h2>
        <p>{c.makesLede}</p>
      </header>
      <ul className="cs-make-grid">
        {ORDER_MAKES.map((make, index) => (
          <li key={make.id} className={index < 2 ? "is-wide" : ""}>
            <button
              type="button"
              className="cs-make"
              aria-label={c.makesPick.replace("{name}", make.title[locale])}
              onClick={() => onPick(make)}
            >
              <span className="cs-make-art" aria-hidden="true">
                <Image
                  src={make.image}
                  alt=""
                  fill
                  sizes="(max-width: 700px) 45vw, 22rem"
                />
              </span>
              <span className="cs-make-text">
                <span className="cs-make-title">{make.title[locale]}</span>
                <span className="cs-make-examples">{make.examples[locale]}</span>
              </span>
              <span className="cs-round" aria-hidden="true">
                <StudioIcon name={readingArrow(locale, "forward")} size={16} />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
