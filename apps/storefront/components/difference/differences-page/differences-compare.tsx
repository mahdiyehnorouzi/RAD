"use client";

import Image from "next/image";
import { useLocale } from "@/components/i18n";
import { differenceMedia, differencePageCopy } from "../const";

const sides = ["industrial", "rad"] as const;

export function DifferencesCompare() {
  const { locale } = useLocale();
  const c = differencePageCopy[locale];

  return (
    <section className="differences-compare" aria-labelledby="differences-compare-title">
      <header className="trace-section-head">
        <h2 id="differences-compare-title">{c.compareTitle}</h2>
        <p>{c.compareLede}</p>
      </header>
      <div className="differences-compare-grid">
        {sides.map((side) => {
          const item = c.compare[side];
          return (
            <section
              className={`differences-compare-side is-${side}`}
              key={side}
              aria-labelledby={`differences-compare-${side}`}
            >
              <figure className="differences-compare-photo">
                <Image
                  src={differenceMedia.compare[side]}
                  alt={item.alt}
                  fill
                  sizes="(min-width: 960px) 22rem, 45vw"
                />
              </figure>
              <h3 id={`differences-compare-${side}`}>{item.label}</h3>
              <ul>
                {item.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </section>
  );
}
