import { quizTear } from "./const";

/** The torn sand hill the page ends on, with the oxide thread running across it into the footer. */
export function QuizFoot() {
  return (
    <div className="sq-foot" aria-hidden="true">
      <svg className="sq-foot-hill" viewBox={quizTear.viewBox} preserveAspectRatio="none" focusable="false">
        <path className="sq-foot-rim" d={quizTear.rim} />
        <path className="sq-foot-edge" d={quizTear.edge} />
      </svg>
      <svg className="sq-foot-thread" viewBox={quizTear.viewBox} preserveAspectRatio="none" focusable="false">
        <path d={quizTear.thread} pathLength={1} />
      </svg>
    </div>
  );
}
