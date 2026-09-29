import type { TraceIconName } from "../type";

const drawings: Record<TraceIconName, React.ReactNode> = {
  clay: (
    <>
      <path
        className="trace-icon-fill"
        d="M10.6 33.8C8.4 27.2 11.4 18.6 19.4 15.2C26.8 12 36 14.6 38.1 22.6C40.2 30.6 35.2 37 26.4 38.1C19.2 39 12.6 38.4 10.6 33.8Z"
      />
      <path d="M17.6 22.4C20.8 23.2 23 25.4 23.9 28.6" />
      <path d="M28.2 18.8C29 21.8 31.6 23.8 34.8 24" />
      <path d="M16.4 32.6C19 33.6 22 33.8 24.6 33.2" />
    </>
  ),
  hand: (
    <path
      className="trace-icon-accent"
      d="M18.2 42.4C13.4 38.6 10.6 33.2 10.4 27.6L10.2 21.2C10.1 19.2 13 19 13.1 21L13.4 26.4L13.6 11.8C13.6 9.6 16.7 9.6 16.8 11.8L17 24.2L17.9 8.6C18 6.4 21.2 6.5 21.1 8.7L20.9 24.2L22.8 10.4C23.1 8.3 26.1 8.7 25.9 10.8L24.6 25.6L28.2 19.8C29.3 18 31.9 19.2 31.1 21.1L27.6 30.4C26.2 34.4 24.8 38.6 24.2 42.6"
    />
  ),
  brush: (
    <>
      <path d="M37.8 7.2L26 21.6" strokeWidth="2.4" />
      <path d="M23.4 20.2L27.8 23.6L25 27.2L20.6 23.8Z" />
      <path
        className="trace-icon-ink"
        d="M20.4 24.4C15.8 26.6 12.6 31.6 11.2 40.8C19 38.4 24.4 33.8 25 28.4Z"
      />
    </>
  ),
  kiln: (
    <>
      <path d="M11.6 15.8H36.4V39.6H11.6Z" />
      <path d="M16 20.6H32V35.2H16Z" />
      <path d="M20.4 15.8V10.4H27.6V15.8" />
      <path d="M14.2 39.6V43M33.8 39.6V43" />
      <path
        className="trace-icon-flame"
        d="M24 33.4C21 33.4 19.6 31.2 19.6 29.2C19.6 26.6 22 25.4 22.2 22.6C24 23.8 24.6 25.2 24.6 26.4C25.4 25.8 25.9 24.8 26 23.8C27.8 25.2 28.6 27 28.6 29C28.6 31.4 26.8 33.4 24 33.4Z"
      />
    </>
  ),
  bowl: (
    <>
      <path d="M7.8 21.8C11 19.9 37 19.9 40.2 21.8C40.2 30.8 33 37 24 37C15 37 7.8 30.8 7.8 21.8Z" />
      <path d="M18.8 37.2C18.6 38.6 19 40 19.6 40.4H28.4C29 40 29.4 38.6 29.2 37.2" />
      <g className="trace-icon-spots">
        <circle cx="15.6" cy="27" r="1.5" />
        <circle cx="22.4" cy="30.4" r="1.2" />
        <circle cx="28.8" cy="26.2" r="1.6" />
        <circle cx="33" cy="29.6" r="1" />
        <circle cx="19.8" cy="33.4" r="1" />
        <circle cx="26.6" cy="34" r="0.9" />
      </g>
    </>
  ),
};

/** Hand-drawn process marks; one stroke weight, kiln green with oxide accents. */
export function TraceIcon({ name, className = "" }: { name: TraceIconName; className?: string }) {
  return (
    <svg
      className={`trace-icon ${className}`}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      {drawings[name]}
    </svg>
  );
}
