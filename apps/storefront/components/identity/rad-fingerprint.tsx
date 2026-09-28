import { useId, useMemo } from "react";
import { fingerprintRidges } from "@/lib/identity";
import "./identity.css";

const RIDGES = { mark: 7, field: 14 } as const;

/**
 * The work's own print, drawn from its RAD number: no two works share one.
 * `mark` is the compact identifier; `field` is the full print for large,
 * faint repeats.
 */
export function RadFingerprint({
  radNumber,
  density = "mark",
  className = "",
  label,
}: {
  radNumber: number;
  density?: keyof typeof RIDGES;
  className?: string;
  label?: string;
}) {
  const clip = `fp${useId().replace(/[^\w-]/g, "")}`;
  const ridges = useMemo(
    () => fingerprintRidges(radNumber, RIDGES[density]),
    [radNumber, density],
  );

  return (
    <svg
      className={`rad-fingerprint is-${density} ${className}`}
      viewBox="0 0 100 100"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <clipPath id={clip}>
        <ellipse cx="50" cy="50" rx="39" ry="48" />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        {ridges.map((path, index) => (
          <path key={index} d={path} />
        ))}
      </g>
    </svg>
  );
}
