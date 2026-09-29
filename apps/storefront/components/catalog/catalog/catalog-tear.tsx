type TearShape = { viewBox: string; rim: string; edge: string };

/** A torn paper edge: a pale deckled rim with the sheet laid over it. */
export function CatalogTear({
  shape,
  className,
}: {
  shape: TearShape;
  className: string;
}) {
  return (
    <svg
      className={`plp-tear ${className}`}
      viewBox={shape.viewBox}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path className="plp-tear-rim" d={shape.rim} />
      <path className="plp-tear-edge" d={shape.edge} />
    </svg>
  );
}
