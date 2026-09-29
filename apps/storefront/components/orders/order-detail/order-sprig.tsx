/** A pen-drawn oxide sprig over a sand wash; sits at the reading end of a card. */
export function OrderSprig({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`order-sprig ${className}`}
      viewBox="0 0 120 150"
      aria-hidden="true"
      focusable="false"
    >
      <path
        className="order-sprig-wash"
        d="M22 72C12 42 46 18 78 36c30 17 38 68 12 92-26 24-60 2-68-56Z"
      />
      <g className="order-sprig-line">
        <path d="M62 146C57 112 59 72 80 12" />
        <path d="M60 126Q40 124 28 100Q50 104 60 126Z" />
        <path d="M60 126Q44 114 31 102" />
        <path d="M59 108Q80 110 93 88Q70 90 59 108Z" />
        <path d="M59 108Q76 98 90 90" />
        <path d="M61 86Q40 82 30 58Q52 64 61 86Z" />
        <path d="M61 86Q46 74 33 61" />
        <path d="M65 66Q88 66 99 44Q76 46 65 66Z" />
        <path d="M65 66Q82 56 96 47" />
        <path d="M71 45Q53 40 47 18Q65 26 71 45Z" />
        <path d="M77 30Q95 28 101 10Q83 14 77 30Z" />
      </g>
    </svg>
  );
}
