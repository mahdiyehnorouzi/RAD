/** Loose pen-drawn balloon: a loop with its string trailing off the edge. */
export function AboutBalloon() {
  return (
    <svg
      className="about-balloon"
      viewBox="0 0 64 56"
      aria-hidden="true"
      focusable="false"
    >
      <path pathLength={1} d="M42 4C53 3 61 11 59 22C57 33 46 38 37 34C28 30 26 18 31 11C34 7 38 5 42 4Z" />
      <path pathLength={1} d="M37 34C35 36 36 38 33 38" />
      <path pathLength={1} d="M33 38C26 40 20 43 14 48C10 51 5 53 1 54" />
    </svg>
  );
}
