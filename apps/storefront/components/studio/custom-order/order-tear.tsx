import type { OrderTearShape } from "../const";

/** A torn paper edge in the page colour, laid across the edge of a photographic band. */
export function OrderTear({ shape, className }: { shape: OrderTearShape; className: string }) {
  return (
    <svg
      className={`cs-tear ${className}`}
      viewBox={shape.viewBox}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path className="cs-tear-rim" d={shape.rim} />
      <path className="cs-tear-edge" d={shape.edge} />
    </svg>
  );
}
