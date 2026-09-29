import { useId } from "react";

const SHAPES = {
  /** A tall pool bleeding in from the right edge. */
  edge: {
    viewBox: "0 0 240 260",
    d: "M240 0 H70 C58 26 92 44 84 70 C76 98 40 104 46 136 C52 170 96 170 104 204 C110 230 92 246 112 260 H240 Z",
    cx: "78%",
    cy: "22%",
    bleed: 46,
    blur: 2.2,
    stops: [0.62, 0.4, 0.14],
  },
  /** A torn patch tucked into the top-left corner. */
  corner: {
    viewBox: "0 0 200 120",
    d: "M0 0 H192 C176 10 184 24 162 32 C138 40 132 58 106 62 C80 66 70 84 46 90 C28 94 16 106 0 118 Z",
    cx: "12%",
    cy: "8%",
    bleed: 16,
    blur: 0.6,
    stops: [0.9, 0.72, 0.48],
  },
} as const;

/** Terracotta watercolour wash; position it with `className`. */
export function WatercolorWash({
  shape,
  className,
}: {
  shape: keyof typeof SHAPES;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const { viewBox, d, cx, cy, bleed, blur, stops } = SHAPES[shape];
  return (
    <svg
      className={className}
      viewBox={viewBox}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <filter id={`${id}-wash`} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="3" seed="7" result="flow" />
          <feDisplacementMap in="SourceGraphic" in2="flow" scale={bleed} result="bleed" />
          <feGaussianBlur in="bleed" stdDeviation={blur} result="soft" />
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="3" result="noise" />
          <feColorMatrix
            in="noise"
            values="0 0 0 0 0.45  0 0 0 0 0.22  0 0 0 0 0.15  0 0 0 0.28 0"
            result="grain"
          />
          <feComposite in="grain" in2="soft" operator="in" result="speckle" />
          <feMerge>
            <feMergeNode in="soft" />
            <feMergeNode in="speckle" />
          </feMerge>
        </filter>
        <radialGradient id={`${id}-pool`} cx={cx} cy={cy} r="85%">
          <stop offset="0" stopColor="#b3654a" stopOpacity={stops[0]} />
          <stop offset="0.5" stopColor="#c98b6f" stopOpacity={stops[1]} />
          <stop offset="1" stopColor="#dcae94" stopOpacity={stops[2]} />
        </radialGradient>
      </defs>
      <g filter={`url(#${id}-wash)`}>
        <path
          d={d}
          fill={`url(#${id}-pool)`}
          stroke="#9a5238"
          strokeOpacity="0.3"
          strokeWidth="2.5"
        />
      </g>
    </svg>
  );
}
