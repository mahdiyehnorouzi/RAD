"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/components/i18n";
import { orderCopy, orderMedia, orderTears } from "../const";
import { StudioIcon, readingArrow } from "../studio-icon";
import { OrderTear } from "./order-tear";
import styles from "./order-hero.module.css";
import order from "./custom-order.module.css";
import btn from "../studio-btn.module.css";

export function OrderHero() {
  const { locale, href } = useLocale();
  const c = orderCopy[locale];

  return (
    <section className={styles.csHero} aria-labelledby="custom-order-title">
      <figure className={styles.csHeroArch}>
        <Image
          {...orderMedia.arch}
          alt={c.heroAlt}
          priority
          sizes="(min-width: 960px) 32rem, 100vw"
        />
      </figure>

      <div className={styles.csHeroCopy}>
        <h1 id="custom-order-title">{c.heroTitle}</h1>
        <p>{c.heroLede}</p>
      </div>

      <div className={styles.csHeroStage}>
        <p className={styles.csHeroHand}>
          <span>{c.heroHand[0]}</span>
          <span>{c.heroHand[1]}</span>
          <svg
            className={`${order.csThread} ${styles.csHeroThread}`}
            viewBox="0 0 160 40"
            aria-hidden="true"
            focusable="false"
          >
            <path
              pathLength={1}
              d="M4 22C30 8 52 34 78 20S120 6 132 18c8 8-4 16-10 8s16-14 34-10"
            />
          </svg>
        </p>
      </div>

      <div className={styles.csHeroActions}>
        <OrderTear shape={orderTears.hero} className={styles.csHeroTear} />
        <a className={`${btn.csBtn} ${btn.csBtnSolid}`} href="#your-idea">
          <span>{c.heroCta}</span>
          <StudioIcon name={readingArrow(locale, "forward")} size={20} />
        </a>
        <Link
          className={`${btn.csBtn} ${btn.csBtnPaper}`}
          href={href("/differences")}
        >
          <StudioIcon name="play" size={22} />
          <span>{c.heroExamples}</span>
        </Link>
      </div>

      <OrderTear shape={orderTears.hero} className={styles.csHeroFoot} />
    </section>
  );
}
