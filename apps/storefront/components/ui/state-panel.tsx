import type { ReactNode } from "react";
import "./state-panel.css";

type Tone = "empty" | "error" | "notice";

/** Full-width empty / error / notice block that replaces a page's main content. */
export function StatePanel({
  tone = "empty",
  eyebrow,
  title,
  children,
  actions,
  as: Heading = "h2",
  className = "",
}: {
  tone?: Tone;
  eyebrow?: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  as?: "h1" | "h2";
  className?: string;
}) {
  return (
    <div
      className={`state-panel state-panel--${tone} ${className}`.trim()}
      role={tone === "error" ? "alert" : undefined}
    >
      {eyebrow ? <span className="state-panel-eyebrow">{eyebrow}</span> : null}
      <Heading className="state-panel-title">{title}</Heading>
      {children ? <div className="state-panel-body">{children}</div> : null}
      {actions ? <div className="state-panel-actions">{actions}</div> : null}
    </div>
  );
}

/** One-line banner above content that is still usable (stale data, live changes). */
export function StateNotice({
  tone = "notice",
  children,
  action,
  live = "polite",
  className = "",
}: {
  tone?: Tone;
  children: ReactNode;
  action?: ReactNode;
  live?: "polite" | "assertive" | "off";
  className?: string;
}) {
  return (
    <div
      className={`state-notice state-notice--${tone} ${className}`.trim()}
      role={tone === "error" ? "alert" : "status"}
      aria-live={live}
    >
      <div className="state-notice-body">{children}</div>
      {action ? <div className="state-notice-action">{action}</div> : null}
    </div>
  );
}
