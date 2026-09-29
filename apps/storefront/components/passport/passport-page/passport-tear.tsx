type TearShape = { viewBox: string; rim: string; edge: string };

/** A torn paper edge: a pale deckled rim with the sheet laid over it. */
export function PassportTear({
  shape,
  className,
}: {
  shape: TearShape;
  className: string;
}) {
  return (
    <svg
      className={`passport-tear ${className}`}
      viewBox={shape.viewBox}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path className="passport-tear-rim" d={shape.rim} />
      <path className="passport-tear-edge" d={shape.edge} />
    </svg>
  );
}
