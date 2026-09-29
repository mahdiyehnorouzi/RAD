type TearShape = { viewBox: string; edge: string };

/** A torn paper edge laid over a photograph so the page reads as one sheet. */
export function TraceTear({ shape, className }: { shape: TearShape; className: string }) {
  return (
    <svg
      className={`trace-tear ${className}`}
      viewBox={shape.viewBox}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d={shape.edge} />
    </svg>
  );
}
