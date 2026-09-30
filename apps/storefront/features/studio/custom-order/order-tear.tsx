import type { OrderTearShape } from "../const";
import styles from "./order-tear.module.css";

/** A torn paper edge in the page colour, laid across the edge of a photographic band. */
export function OrderTear({
  shape,
  className,
}: {
  shape: OrderTearShape;
  className: string;
}) {
  return (
    <svg
      className={`${styles.csTear} ${className}`}
      viewBox={shape.viewBox}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path className={styles.csTearRim} d={shape.rim} />
      <path className={styles.csTearEdge} d={shape.edge} />
    </svg>
  );
}
