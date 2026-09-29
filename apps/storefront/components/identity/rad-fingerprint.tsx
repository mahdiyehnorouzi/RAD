"use client";

import { useId, useMemo, type CSSProperties } from "react";
import { fingerprintRidges } from "@/lib/identity";
import { useInViewOnce } from "./hooks";
import "./identity.css";

const RIDGES = { mark: 7, field: 14 } as const;

/**
 * The work's own print, drawn from its RAD number: no two works share one.
 * `mark` is the compact identifier; `field` is the full print for large,
 * faint repeats. `animate` presses the print in from its core when it comes
 * into view, then lets a faint ink ripple run outward.
 */
export function RadFingerprint({
  radNumber,
  density = "mark",
  className = "",
  label,
  animate = false,
}: {
  radNumber: number;
  density?: keyof typeof RIDGES;
  className?: string;
  label?: string;
  animate?: boolean;
}) {
  const clip = `fp${useId().replace(/[^\w-]/g, "")}`;
  const ridges = useMemo(
    () => fingerprintRidges(radNumber, RIDGES[density]),
    [radNumber, density],
  );
  const { ref, seen } = useInViewOnce<SVGSVGElement>(animate);
  const motion = animate ? ` is-animated${seen ? " is-pressed" : ""}` : "";

  return (
    <svg
      ref={ref}
      className={`rad-fingerprint is-${density}${motion} ${className}`}
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
          <path
            key={index}
            d={path}
            pathLength={animate ? 1 : undefined}
            style={animate ? ({ "--ridge": index } as CSSProperties) : undefined}
          />
        ))}
      </g>
    </svg>
  );
}
