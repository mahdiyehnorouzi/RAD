type TearShape = { viewBox: string; edge: string; rim?: string };

/** A torn paper edge laid across the top of the next band. */
export function ContactTear({ shape, className }: { shape: TearShape; className: string }) {
  return (
    <svg
      className={`contact-tear ${className}`}
      viewBox={shape.viewBox}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {shape.rim ? <path className="contact-tear-rim" d={shape.rim} /> : null}
      <path className="contact-tear-edge" d={shape.edge} />
    </svg>
  );
}
