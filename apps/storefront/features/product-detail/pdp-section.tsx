"use client";
import type { ReactNode } from "react";
import { CircleMinus, CirclePlus } from "lucide-react";
import styles from "./pdp-section.module.css";

/**
 * One column of page, one list of folds: every section is the same numbered
 * card (number · divider · brush stroke · title/lede · plus-minus) on every
 * breakpoint — desktop is a wider layout of the identical component, not a
 * different "open prose" treatment. `openByDefault` only affects the first
 * paint; the shared `name` groups every PDP fold into one native exclusive
 * accordion (opening one closes any other that was open), which needs no
 * JS — `<details name>` is a plain HTML accordion group.
 */
export function PdpSection({
  id,
  title,
  lede,
  mark,
  openByDefault = false,
  groupName = "pdp-fold",
  className = "",
  bodyClassName = "",
  children,
}: {
  id: string;
  title: string;
  lede?: string;
  mark?: ReactNode;
  openByDefault?: boolean;
  /** Shared across every PdpSection on the page so only one stays open at a time. */
  groupName?: string;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <details
      name={groupName}
      className={`pdp-section-card ${styles.section} ${styles.card} ${className}`}
      open={openByDefault}
    >
      <summary>
        <span className={styles.sectionIndex} aria-hidden="true" />
        {mark ? <span className={styles.sectionMark}>{mark}</span> : null}
        <span className={styles.sectionHead}>
          <h2 id={id}>{title}</h2>
          {lede ? <span className={styles.sectionLede}>{lede}</span> : null}
        </span>
        <CirclePlus
          className={`${styles.sectionIcon} ${styles.plus}`}
          aria-hidden="true"
        />
        <CircleMinus
          className={`${styles.sectionIcon} ${styles.minus}`}
          aria-hidden="true"
        />
      </summary>
      <div className={`${styles.sectionBody} ${bodyClassName}`}>{children}</div>
    </details>
  );
}
