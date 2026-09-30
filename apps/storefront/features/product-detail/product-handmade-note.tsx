"use client";
import { useMemo } from "react";
import { Hand } from "lucide-react";
import { useLocale } from "@/components/i18n";
import { handLoop } from "@/lib/identity";
import { pdpCopy } from "./const";
import styles from "./product-handmade-note.module.css";

/** A maker's margin note, not a notice: pencil loop, hand, signed with the number. */
export function ProductHandmadeNote({
  radNumber,
  code,
  change,
}: {
  radNumber?: number;
  code?: string;
  /** What the kiln or the hand changed on this work, when it was recorded. */
  change?: string;
}) {
  const { locale } = useLocale();
  const c = pdpCopy[locale];
  const loop = useMemo(() => handLoop(radNumber ?? 1), [radNumber]);

  return (
    <aside className={styles.note}>
      <svg
        className={styles.noteLoop}
        viewBox="0 0 200 100"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <path d={loop} />
      </svg>
      <Hand className={styles.noteHand} aria-hidden="true" />
      <b className={styles.noteTitle}>
        {change ? c.varianceTitle : c.handmadeTitle}
      </b>
      <p>
        {change ??
          c.handmadeLines.map((line) => <span key={line}>{line}</span>)}
      </p>
      {code ? (
        <span className={styles.noteSign} dir="ltr">
          ~ {code}
        </span>
      ) : null}
    </aside>
  );
}
