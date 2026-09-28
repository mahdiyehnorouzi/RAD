"use client";
import type { ReactNode } from "react";
import { CircleMinus, CirclePlus } from "lucide-react";
import { useMediaQuery } from "./hooks";

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
  children,
}: {
  id: string;
  title: string;
  lede?: string;
  mark?: ReactNode;
  desktop?: "plain" | "open" | "closed";
  className?: string;
  children: ReactNode;
}) {
  const compact = useMediaQuery("(max-width: 900px)");
  const icons = (
    <>
      <CirclePlus className="pdp-section-icon is-plus" aria-hidden="true" />
      <CircleMinus className="pdp-section-icon is-minus" aria-hidden="true" />
    </>
  );

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
      className={`pdp-section is-fold ${compact ? "is-card" : ""} ${className}`}
      open={!compact && desktop === "open"}
    >
      {compact ? (
        <summary>
          {icons}
          <span className="pdp-section-head">
            <h2 id={id}>{title}</h2>
            {lede ? <span className="pdp-section-lede">{lede}</span> : null}
          </span>
          {mark ? <span className="pdp-section-mark">{mark}</span> : null}
          <span className="pdp-section-index" aria-hidden="true" />
        </summary>
      ) : (
        <summary>
          <h2 id={id}>{title}</h2>
          {icons}
        </summary>
      )}
      <div className="pdp-section-body">{children}</div>
    </details>
  );
}
