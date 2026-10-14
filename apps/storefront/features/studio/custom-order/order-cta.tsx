"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/components/i18n";
import { orderCopy, orderMedia } from "../const";
import { StudioIcon } from "../studio-icon";
import { useInView } from "../use-in-view";
import styles from "./order-cta.module.css";
import order from "./custom-order.module.css";
import btn from "../studio-btn.module.css";

export function OrderCta() {
  const { locale, href } = useLocale();
  const c = orderCopy[locale];
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <section className={order.csSection} aria-labelledby="custom-order-cta">
      <div
        ref={ref}
        className={styles.csCta}
        data-in-view={inView || undefined}
      >
        <figure className={styles.csCtaArt}>
          <Image
            {...orderMedia.ctaOliveVase}
            alt={c.ctaAlt}
            sizes="(min-width: 960px) 26rem, 42vw"
            loading="lazy"
          />
          <svg
            className={styles.csCtaDoodle}
            viewBox="0 0 70 70"
            aria-hidden="true"
            focusable="false"
          >
            <path
              pathLength={1}
              d="M6 60c16 6 30-4 32-18M58 10c4 10-2 18-12 18"
            />
          </svg>
        </figure>
        <div className={styles.csCtaCopy}>
          <h2 id="custom-order-cta">{c.ctaTitle}</h2>
          <p>{c.ctaBody}</p>
          <Link
            className={`${btn.csBtn} ${btn.csBtnSolid} ${btn.csBtnArrowLeft}`}
            href={href("/studio/start")}
          >
            <span>{c.ctaButton}</span>
            <StudioIcon name="arrow_left" size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
