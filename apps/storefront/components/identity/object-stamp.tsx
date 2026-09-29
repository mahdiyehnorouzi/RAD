import { useId } from "react";
import "./identity.css";

/**
 * The hand-pressed RAD seal. Its wording is the brand mark and stays Latin in
 * both locales; the number and year arrive already in the reader's digits.
 * The same seal is meant for packaging, certificates and the card in the box.
 */
export function ObjectStamp({
  radNumber,
  code,
  year,
  label,
  emblem,
  className = "",
}: {
  radNumber: number;
  code: string;
  year?: string;
  label: string;
  /** Draws the maker's sprig in the centre instead of the number. */
  emblem?: "sprig";
  className?: string;
}) {
  const id = `st${useId().replace(/[^\w-]/g, "")}`;

  return (
    <svg
      className={`object-stamp ${className}`}
      viewBox="0 0 120 120"
      role="img"
      aria-label={label}
      focusable="false"
    >
      <defs>
        <filter id={`${id}-ink`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.7"
            numOctaves="2"
            seed={radNumber}
            result="wobble"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="wobble"
            scale="1.8"
            xChannelSelector="R"
            yChannelSelector="G"
            result="pressed"
          />
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1.9"
            numOctaves="1"
            seed={radNumber + 7}
            result="grain"
          />
          <feColorMatrix
            in="grain"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -2.6 0 0 0 2.05"
            result="coverage"
          />
          <feComposite in="pressed" in2="coverage" operator="in" />
        </filter>
        <path id={`${id}-top`} d="M20 60a40 40 0 0 1 80 0" />
        <path id={`${id}-bottom`} d="M13.5 60a46.5 46.5 0 0 0 93 0" />
      </defs>
      <g filter={`url(#${id}-ink)`}>
        <circle className="object-stamp-rim" cx="60" cy="60" r="55" />
        <circle className="object-stamp-inner" cx="60" cy="60" r="48.5" />
        <text className="object-stamp-arc">
          <textPath href={`#${id}-top`} startOffset="50%" textAnchor="middle">
            RĀD OBJECT
          </textPath>
        </text>
        <text className="object-stamp-arc">
          <textPath
            href={`#${id}-bottom`}
            startOffset="50%"
            textAnchor="middle"
          >
            ONE OF ONE
          </textPath>
        </text>
        <circle className="object-stamp-dot" cx="16" cy="60" r="1.6" />
        <circle className="object-stamp-dot" cx="104" cy="60" r="1.6" />
        <text className="object-stamp-no" x="60" y="47" textAnchor="middle">
          №
        </text>
        {emblem === "sprig" ? (
          <g className="object-stamp-sprig">
            <path d="M60 75c0-6 .2-12 1.2-18.5" />
            <path d="M60.3 68.5c-4.2-.4-6.6-3-7-6.6 3.6.2 6.3 2.4 7 6.6Z" />
            <path d="M60.8 62.6c4-.9 6.2-3.8 6.2-7.3-3.5.5-6 3-6.2 7.3Z" />
            <path d="M61.3 56.3c-2.2-1.6-2.6-4.4-1-6.8 1.9 1.7 2.2 4.4 1 6.8Z" />
            <circle cx="48.5" cy="70" r="3.7" />
            <circle cx="71.5" cy="70" r="3.7" />
            <circle className="object-stamp-dot" cx="48.5" cy="70" r="1.1" />
            <circle className="object-stamp-dot" cx="71.5" cy="70" r="1.1" />
          </g>
        ) : (
          <text className="object-stamp-code" x="60" y="70" textAnchor="middle">
            {code}
          </text>
        )}
        {year ? (
          <>
            <path className="object-stamp-rule" d="M38 77.5h44" />
            <text
              className="object-stamp-year"
              x="60"
              y="87"
              textAnchor="middle"
            >
              {year}
            </text>
          </>
        ) : null}
      </g>
    </svg>
  );
}
