"use client";
import type { ReactNode } from "react";
import { CircleMinus, CirclePlus } from "lucide-react";
import { useMediaQuery } from "./hooks";

/**
 * One column of page, one list of folds: on narrow screens every section
 * collapses; on wide screens `desktop` picks open prose or a fold row.
 */
export function PdpSection({
  id,
  title,
  desktop = "plain",
  className = "",
  children,
}: {
  id: string;
  title: string;
  desktop?: "plain" | "open" | "closed";
  className?: string;
  children: ReactNode;
}) {
  const compact = useMediaQuery("(max-width: 900px)");

  if (!compact && desktop === "plain") {
    return (
      <section className={`pdp-section ${className}`} aria-labelledby={id}>
        <h2 id={id}>{title}</h2>
        {children}
      </section>
    );
  }

  return (
    <details
      key={compact ? "compact" : "wide"}
      className={`pdp-section is-fold ${className}`}
      open={!compact && desktop === "open"}
    >
      <summary>
        <h2 id={id}>{title}</h2>
        <CirclePlus className="pdp-section-icon is-plus" aria-hidden="true" />
        <CircleMinus className="pdp-section-icon is-minus" aria-hidden="true" />
      </summary>
      <div className="pdp-section-body">{children}</div>
    </details>
  );
}
