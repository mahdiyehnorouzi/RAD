import styles from "./journey-spark.module.css";
/** Three short pencil ticks, the hand-drawn "look here" beside a photo or tag. */
export function JourneySpark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`${styles.journeySpark} ${className}`}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 9.5 10.6 2.5M15.2 11.4 20.4 6.6M9.4 12.6 2.8 11" />
    </svg>
  );
}
