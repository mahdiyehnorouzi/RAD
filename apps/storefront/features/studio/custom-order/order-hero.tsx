"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/components/i18n";
import { orderCopy, orderMedia } from "../const";
import { StudioIcon } from "../studio-icon";
import styles from "./order-hero.module.css";
import btn from "../studio-btn.module.css";

function scrollToSamples(event: React.MouseEvent<HTMLAnchorElement>) {
  const target = document.getElementById("samples");
  if (!target) return;
  event.preventDefault();
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
}

export function OrderHero() {
  const { locale, href } = useLocale();
  const c = orderCopy[locale];

  return (
    <section className={styles.csHero} aria-labelledby="custom-order-title">
      <p className={styles.csHeroHand}>
        <span>{c.heroHand[0]}</span>
        <span>{c.heroHand[1]}</span>
        <svg
          className={styles.csHeroScribble}
          viewBox="0 0 120 20"
          aria-hidden="true"
          focusable="false"
        >
          <path pathLength={1} d="M2 11c14-9 24 9 38 1s24-10 38-2 24 8 38 0" />
        </svg>
      </p>

      <div className={styles.csHeroRow}>
        <figure className={styles.csHeroArt}>
          <span className={styles.csHeroClip}>
            <Image
              {...orderMedia.heroLamp}
              alt={c.heroAlt}
              priority
              sizes="(min-width: 960px) 36rem, 40vw"
            />
          </span>
          <svg
            className={styles.csHeroDoodle}
            viewBox="0 0 90 90"
            aria-hidden="true"
            focusable="false"
          >
            <path pathLength={1} d="M70 8c6 4 8 12 2 16M8 70c10 6 20 2 22-8" />
          </svg>
        </figure>

        <div className={styles.csHeroCopy}>
          <h1 id="custom-order-title">{c.heroTitle}</h1>
          <p>{c.heroLede}</p>
        </div>
      </div>

      <div className={styles.csHeroActions}>
        <Link
          className={`${btn.csBtn} ${btn.csBtnSolid} ${btn.csBtnArrowLeft} ${styles.csHeroBtn}`}
          href={href("/studio/start")}
        >
          <span>{c.heroCta}</span>
          <StudioIcon name="arrow_left" size={18} />
        </Link>
        <Link
          className={`${btn.csBtn} ${btn.csBtnPaper} ${styles.csHeroBtn}`}
          href="#samples"
          onClick={scrollToSamples}
        >
          <StudioIcon name="play" size={18} />
          <span>{c.heroExamples}</span>
        </Link>
      </div>
    </section>
  );
}
