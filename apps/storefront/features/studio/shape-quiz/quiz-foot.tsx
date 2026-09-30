import { quizTear } from "./const";
import styles from "./quiz-foot.module.css";

/** The torn sand hill the page ends on, with the oxide thread running across it into the footer. */
export function QuizFoot() {
  return (
    <div className={styles.sqFoot} aria-hidden="true">
      <svg
        viewBox={quizTear.viewBox}
        preserveAspectRatio="none"
        focusable="false"
      >
        <path className={styles.sqFootRim} d={quizTear.rim} />
        <path className={styles.sqFootEdge} d={quizTear.edge} />
      </svg>
      <svg
        className={styles.sqFootThread}
        viewBox={quizTear.viewBox}
        preserveAspectRatio="none"
        focusable="false"
      >
        <path d={quizTear.thread} pathLength={1} />
      </svg>
    </div>
  );
}
