"use client";

export function OrderTimeline({
  activeStage,
  stages,
  number,
  label,
}: {
  activeStage: number;
  stages: string[];
  number: (value: number) => string;
  label: string;
}) {
  return (
    <ol className="my-6 grid gap-2 md:grid-cols-5" aria-label={label}>
      {stages.map((stage, index) => (
        <li
          key={stage}
          className={`flex items-center gap-2 text-sm ${index <= activeStage ? "text-rad-moss" : "text-rad-muted"}`}
          aria-current={index === activeStage ? "step" : undefined}
        >
          <i className="not-italic">{number(index + 1)}</i>
          <span>{stage}</span>
        </li>
      ))}
    </ol>
  );
}
