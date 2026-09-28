import { useId, type Ref } from "react";
import type { ThreadGeometry } from "./hooks";

export function RedThread({
  ref,
  geometry,
}: {
  ref: Ref<SVGSVGElement>;
  geometry: ThreadGeometry | null;
}) {
  const maskId = `red-thread-gaps-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const hasGaps = !!geometry?.gaps.length;

  return (
    <svg
      ref={ref}
      className="red-thread"
      width={geometry?.width ?? 0}
      height={geometry?.height ?? 0}
      viewBox={geometry ? `0 0 ${geometry.width} ${geometry.height}` : undefined}
      aria-hidden="true"
      focusable="false"
    >
      {geometry?.d ? (
        <>
          {hasGaps ? (
            <defs>
              <mask
                id={maskId}
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width={geometry.width}
                height={geometry.height}
              >
                <rect width={geometry.width} height={geometry.height} fill="#fff" />
                {geometry.gaps.map((gap) => (
                  <rect
                    key={`${gap.top}-${gap.bottom}`}
                    y={gap.top}
                    width={geometry.width}
                    height={Math.max(0, gap.bottom - gap.top)}
                    fill="#000"
                  />
                ))}
              </mask>
            </defs>
          ) : null}
          <g mask={hasGaps ? `url(#${maskId})` : undefined}>
            <path data-thread-line className="red-thread-shade" d={geometry.d} />
            <path data-thread-line className="red-thread-line" d={geometry.d} />
            <circle data-thread-bead className="red-thread-bead" r="3.6" />
          </g>
          {geometry.knots.map((knot) => (
            <g key={`${knot.x}-${knot.y}`} className="red-thread-knot">
              <circle className="red-thread-knot-shade" cx={knot.x + 1} cy={knot.y + 2.5} r="4.4" />
              <circle cx={knot.x} cy={knot.y} r="4.4" />
              <circle className="red-thread-knot-shine" cx={knot.x - 1.4} cy={knot.y - 1.5} r="1.3" />
            </g>
          ))}
        </>
      ) : null}
    </svg>
  );
}
