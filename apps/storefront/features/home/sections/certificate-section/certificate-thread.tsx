import styles from "./certificate-thread.module.css";

/**
 * Two bare anchors at the card's top and foot. The page-wide thread (drawn
 * once in `RedThread`) threads straight through them on its own continuous
 * path — nothing here draws a second, separate line or a static bead, so
 * there is one line, not two fragments pretending to meet.
 */
export function CertificateThread() {
  return (
    <>
      <span
        className={styles.certificateThreadIn}
        data-thread-anchor
        aria-hidden="true"
      />
      <span
        className={styles.certificateThreadOut}
        data-thread-anchor
        aria-hidden="true"
      />
    </>
  );
}
