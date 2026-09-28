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
  className = "",
}: {
  radNumber: number;
  code: string;
  year?: string;
  label: string;
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
        <text className="object-stamp-code" x="60" y="70" textAnchor="middle">
          {code}
        </text>
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
