"use client";
import type { ReactNode } from "react";
import { CircleMinus, CirclePlus } from "lucide-react";
import { useMediaQuery } from "./hooks";
import styles from "./pdp-section.module.css";

/**
 * One column of page, one list of folds: on narrow screens every section
 * collapses into a numbered card carrying a one-line lede and the work's
 * stroke; on wide screens `desktop` picks open prose or a fold row.
 */
export function PdpSection({
  id,
  title,
  lede,
  mark,
  desktop = "plain",
  className = "",
  bodyClassName = "",
  children,
}: {
  id: string;
  title: string;
  lede?: string;
  mark?: ReactNode;
  desktop?: "plain" | "open" | "closed";
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  const compact = useMediaQuery("(max-width: 900px)");
  const icons = (
    <>
      <CirclePlus
        className={`${styles.sectionIcon} ${styles.plus}`}
        aria-hidden="true"
      />
      <CircleMinus
        className={`${styles.sectionIcon} ${styles.minus}`}
        aria-hidden="true"
      />
    </>
  );

  if (!compact && desktop === "plain") {
    return (
      <section
        className={`${styles.section} ${className}`}
        aria-labelledby={id}
      >
        <h2 id={id}>{title}</h2>
        {children}
      </section>
    );
  }

  return (
    <details
      key={compact ? "compact" : "wide"}
      className={`${styles.section} ${styles.fold} ${compact ? styles.card : ""} ${className}`}
      open={!compact && desktop === "open"}
    >
      {compact ? (
        <summary>
          {icons}
          <span className={styles.sectionHead}>
            <h2 id={id}>{title}</h2>
            {lede ? <span className={styles.sectionLede}>{lede}</span> : null}
          </span>
          {mark ? <span className={styles.sectionMark}>{mark}</span> : null}
          <span className={styles.sectionIndex} aria-hidden="true" />
        </summary>
      ) : (
        <summary>
          <h2 id={id}>{title}</h2>
          {icons}
        </summary>
      )}
      <div className={`${styles.sectionBody} ${bodyClassName}`}>{children}</div>
    </details>
  );
}
