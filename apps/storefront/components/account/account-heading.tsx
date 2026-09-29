import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import "./account-heading.css";

/** The head of every profile tab: a round icon mark, the title, one plain line, and an optional action. */
export function AccountHeading({
  icon: Icon,
  title,
  body,
  action,
  as: Heading = "h1",
  id,
}: {
  icon: LucideIcon;
  title: ReactNode;
  body?: ReactNode;
  action?: ReactNode;
  as?: "h1" | "h2";
  id?: string;
}) {
  return (
    <header className={`account-heading account-heading--${Heading}`}>
      <span className="account-badge" aria-hidden="true">
        <Icon strokeWidth={1.6} />
      </span>
      <div className="account-heading-copy">
        <Heading id={id}>{title}</Heading>
        {body ? <p>{body}</p> : null}
      </div>
      {action ? <div className="account-heading-action">{action}</div> : null}
    </header>
  );
}
