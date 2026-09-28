import { useId, type ReactNode } from "react";
import type { StateArtKind, StateLayout } from "../type";
import { StateArt } from "./state-art";
import "./state-screen.css";

/** Still-life empty / error screen: one object, a short explanation, and the way forward. */
export function StateScreen({
  art,
  layout = "stack",
  tone = "empty",
  code,
  title,
  body,
  actions,
  badge,
  as: Heading = "h2",
  children,
  className = "",
}: {
  art: StateArtKind;
  layout?: StateLayout;
  tone?: "empty" | "error";
  /** Short status line above the title, e.g. the HTTP error code. */
  code?: ReactNode;
  title: ReactNode;
  body?: ReactNode;
  actions?: ReactNode;
  badge?: ReactNode;
  as?: "h1" | "h2";
  /** Secondary ways out that sit under the actions: chips, suggested works. */
  children?: ReactNode;
  className?: string;
}) {
  const titleId = useId();
  return (
    <section
      className={`state-screen state-screen--${layout} state-screen--${tone} ${className}`.trim()}
      aria-labelledby={titleId}
    >
      <div className="state-screen-copy">
        <div role={tone === "error" ? "alert" : undefined}>
          {code ? <p className="state-screen-code">{code}</p> : null}
          <Heading id={titleId} className="state-screen-title">
            {title}
          </Heading>
          {body ? <div className="state-screen-body">{body}</div> : null}
        </div>
        {actions ? <div className="state-screen-actions">{actions}</div> : null}
        {children}
      </div>
      <StateArt kind={art} layout={layout} badge={badge} />
    </section>
  );
}
