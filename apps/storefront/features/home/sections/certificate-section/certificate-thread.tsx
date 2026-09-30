import styles from "./certificate-thread.module.css";
/**
 * The red thread tied through the card: a bead at the top. The home's own
 * thread comes down into the tie, runs behind the card and leaves from its
 * foot for the footer.
 */
export function CertificateThread() {
  return (
    <>
      <span
        className={styles.certificateThreadIn}
        data-thread-anchor
        data-thread-hide="start"
        aria-hidden="true"
      />
      <svg
        className={styles.certificateThreadTie}
        viewBox="0 0 24 44"
        aria-hidden="true"
        focusable="false"
      >
        <path
          className={styles.certificateThreadShade}
          d="M9 0C9 12 15 20 13 33"
        />
        <path
          className={styles.certificateThreadLine}
          d="M9 0C9 12 15 20 13 33"
        />
        <circle
          className={styles.certificateBeadShade}
          cx="14"
          cy="37.5"
          r="4.6"
        />
        <circle className={styles.certificateBead} cx="13" cy="35" r="4.6" />
        <circle
          className={styles.certificateBeadShine}
          cx="11.5"
          cy="33.4"
          r="1.4"
        />
      </svg>
      <span
        className={styles.certificateThreadOut}
        data-thread-anchor
        data-thread-hide="end"
        aria-hidden="true"
      />
    </>
  );
}
