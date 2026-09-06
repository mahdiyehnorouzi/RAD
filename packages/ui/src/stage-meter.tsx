import type { CSSProperties } from "react";
import "./stage-meter.css";

export function StageMeter({
  index,
  total,
  label,
  countLabel,
  kicker,
  nextKicker,
  nextLabel,
  compact = false,
  className = "",
}: {
  index: number;
  total: number;
  label: string;
  countLabel: string;
  kicker: string;
  nextKicker?: string;
  nextLabel?: string;
  compact?: boolean;
  className?: string;
}) {
  const safeTotal = Math.max(1, total);
  const safeIndex = Math.min(Math.max(0, index), safeTotal - 1);
  const percent = Math.round(((safeIndex + 1) / safeTotal) * 100);

  return (
    <div className={`stage-meter${compact ? " compact" : ""}${className ? ` ${className}` : ""}`}>
      <header className="stage-meter-head">
        <div className="stage-meter-copy">
          <p className="stage-meter-kicker">{kicker}</p>
          <p className="stage-meter-now">{label}</p>
        </div>
        <p className="stage-meter-count">{countLabel}</p>
      </header>
      <div
        className="stage-meter-track"
        style={{ "--stage-count": safeTotal } as CSSProperties}
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={safeTotal}
        aria-valuenow={safeIndex + 1}
        aria-valuetext={`${percent}%`}
        aria-label={label}
      >
        {Array.from({ length: safeTotal }, (_, step) => {
          const state = step < safeIndex ? "done" : step === safeIndex ? "current" : "upcoming";
          return <i key={step} className={state} />;
        })}
      </div>
      {nextLabel ? (
        <p className="stage-meter-next">
          {nextKicker ? <span>{nextKicker}</span> : null}
          {nextLabel}
        </p>
      ) : null}
    </div>
  );
}
