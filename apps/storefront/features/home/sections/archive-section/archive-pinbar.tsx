"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLocale } from "@/components/i18n";
import styles from "./archive-pinbar.module.css";

/** The compact bar that stays under the header while the archive scrolls past on small screens. */
export function ArchivePinbar({ shown }: { shown: boolean }) {
  const { t, href, locale } = useLocale();
  const ArrowIcon = locale === "fa" ? ArrowLeft : ArrowRight;

  return (
    <div
      className={`${styles.archivePinbar}${shown ? ` ${styles.shown}` : ""}`}
      inert={!shown}
    >
      <svg
        className={styles.archivePinbarThread}
        viewBox="0 0 24 44"
        aria-hidden="true"
        focusable="false"
      >
        <path
          className={styles.archivePinbarThreadShade}
          d="M5 0C5 14 17 18 15 34"
        />
        <path
          className={styles.archivePinbarThreadLine}
          d="M5 0C5 14 17 18 15 34"
        />
        <circle
          className={styles.archivePinbarBeadShade}
          cx="16"
          cy="37.5"
          r="4.4"
        />
        <circle className={styles.archivePinbarBead} cx="15" cy="35" r="4.4" />
        <circle
          className={styles.archivePinbarBeadShine}
          cx="13.6"
          cy="33.5"
          r="1.3"
        />
      </svg>
      <div className={styles.archivePinbarRow}>
        <span className={styles.archivePinbarSection}>
          {t("archiveEyebrowFull")}
        </span>
        <span className={styles.archivePinbarTitle}>{t("archiveTitle")}</span>
        <Link className={styles.archivePinbarLink} href={href("/products")}>
          <span>{t("allWorks")}</span>
          <ArrowIcon aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
