"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/components/i18n";
import { orderCopy, orderMedia, orderTears } from "../const";
import { StudioIcon, readingArrow } from "../studio-icon";
import { OrderTear } from "./order-tear";

export function OrderHero() {
  const { locale, href } = useLocale();
  const c = orderCopy[locale];

  return (
    <section className="cs-hero" aria-labelledby="custom-order-title">
      <figure className="cs-hero-arch">
        <Image
          {...orderMedia.arch}
          alt={c.heroAlt}
          priority
          sizes="(min-width: 960px) 32rem, 100vw"
        />
      </figure>

      <div className="cs-hero-copy">
        <h1 id="custom-order-title">{c.heroTitle}</h1>
        <p>{c.heroLede}</p>
      </div>

      <div className="cs-hero-stage">
        <p className="cs-hero-hand">
          <span>{c.heroHand[0]}</span>
          <span>{c.heroHand[1]}</span>
          <svg className="cs-thread" viewBox="0 0 160 40" aria-hidden="true" focusable="false">
            <path
              pathLength={1}
              d="M4 22C30 8 52 34 78 20S120 6 132 18c8 8-4 16-10 8s16-14 34-10"
            />
          </svg>
        </p>
      </div>

      <div className="cs-hero-actions">
        <OrderTear shape={orderTears.hero} className="cs-hero-tear" />
        <a className="cs-btn cs-btn-solid" href="#your-idea">
          <span>{c.heroCta}</span>
          <StudioIcon name={readingArrow(locale, "forward")} size={20} />
        </a>
        <Link className="cs-btn cs-btn-paper" href={href("/differences")}>
          <StudioIcon name="play" size={22} />
          <span>{c.heroExamples}</span>
        </Link>
      </div>

      <OrderTear shape={orderTears.hero} className="cs-hero-foot" />
    </section>
  );
}
