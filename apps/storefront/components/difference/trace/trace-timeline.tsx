import "./trace.css";

import Image from "next/image";
import type { TraceStep } from "../type";
import { TraceIcon } from "./trace-icon";

/** Stops hung on one oxide thread; each row draws its own stretch so rows can reflow freely. */
export function TraceTimeline({
  steps,
  labelledBy,
}: {
  steps: TraceStep[];
  labelledBy: string;
}) {
  return (
    <ol className="trace-line" aria-labelledby={labelledBy}>
      {steps.map((step, index) => (
        <li className="trace-step" key={step.id}>
          <div className="trace-step-copy">
            <h3>{step.title}</h3>
            {step.notes.map((note) => (
              <p key={note}>{note}</p>
            ))}
          </div>

          <div className="trace-step-rail" aria-hidden="true">
            <svg className="trace-step-thread" viewBox="0 0 40 100" preserveAspectRatio="none">
              <path
                pathLength={1}
                d={
                  index % 2
                    ? "M20 0C28 18 30 34 20 50C10 66 12 84 20 100"
                    : "M20 0C12 18 10 34 20 50C30 66 28 84 20 100"
                }
              />
            </svg>
            <span className={`trace-step-node ${step.icon ? "has-icon" : ""}`}>
              {step.icon ? <TraceIcon name={step.icon} /> : null}
            </span>
          </div>

          <figure className="trace-step-media">
            {step.image ? (
              <Image
                src={step.image.src}
                alt={step.image.alt}
                fill
                sizes="(min-width: 960px) 24rem, 46vw"
              />
            ) : step.swatch ? (
              <span
                className="trace-step-swatch"
                role="img"
                aria-label={step.swatch.label}
                style={
                  {
                    "--swatch": step.swatch.color,
                    "--swatch-accent": step.swatch.accent,
                  } as React.CSSProperties
                }
              />
            ) : null}
          </figure>
        </li>
      ))}
    </ol>
  );
}
