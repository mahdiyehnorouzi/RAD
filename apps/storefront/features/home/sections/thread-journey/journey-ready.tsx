"use client";

import Image from "next/image";
import { useLocale } from "@/components/i18n";
import { ButtonLink } from "@/components/ui/button-link";
import { journeyMedia } from "./const";
import { useScrollSwing } from "./hooks";
import { JourneySpark } from "./journey-spark";
import styles from "./journey-ready.module.css";

/**
 * Ready works: a rounded photograph with a cream card tag tied onto the
 * thread through its brass grommet, the thread doubled into a cord above it. The tag sways on the thread as the page scrolls, and the thread
 * runs on behind it to the next path.
 */
export function JourneyReady() {
  const { t } = useLocale();
  const tagRef = useScrollSwing<HTMLDivElement>();

  return (
    <article
      className={styles.journeyReady}
      aria-labelledby="journey-ready-title"
    >
      <div className={styles.journeyReadyPhoto}>
        <Image
          src={journeyMedia.ready}
          alt=""
          fill
          sizes="(max-width: 899px) 94vw, 76rem"
        />
      </div>
      <div ref={tagRef} className={styles.journeyTag}>
        <span
          className={styles.journeyTagEyelet}
          data-thread-anchor
          aria-hidden="true"
        />
        <svg
          className={styles.journeyTagTie}
          viewBox="-10 -50 20 56"
          aria-hidden="true"
          focusable="false"
        >
          <path
            className={styles.journeyTagTieShade}
            pathLength={1}
            d="M-1.6 -3C-3.4 -16 -2.8 -34 0 -50M1.6 -3C3.6 -16 2.8 -34 0 -50"
          />
          <path
            className={styles.journeyTagTieLine}
            pathLength={1}
            d="M-1.6 -3C-3.4 -16 -2.8 -34 0 -50"
          />
          <path
            className={styles.journeyTagTieLine}
            pathLength={1}
            d="M1.6 -3C3.6 -16 2.8 -34 0 -50"
          />
          <path
            className={styles.journeyTagTieWrap}
            pathLength={1}
            d="M-4.2 -17.5C-1.5 -15.6 1.5 -15.6 4.2 -17.5M-4.2 -13.8C-1.5 -11.9 1.5 -11.9 4.2 -13.8"
          />
        </svg>
        <h2 id="journey-ready-title">{t("ownPathTitle")}</h2>
        <ButtonLink href="/products">{t("viewWorks")}</ButtonLink>
        <JourneySpark className={styles.journeyTagSpark} />
      </div>
    </article>
  );
}
