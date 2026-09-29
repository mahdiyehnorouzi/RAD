import type { ReactNode } from "react";
import { Clock } from "lucide-react";

/** Countdown box with a draining bar; `fraction` is the share of time left (0–1). */
export function CheckoutMeter({
  title,
  children,
  time,
  fraction,
}: {
  title: ReactNode;
  children?: ReactNode;
  time?: string;
  fraction: number;
}) {
  const left = Math.min(1, Math.max(0, fraction));
  return (
    <div className="checkout-meter" role="status" aria-live="off">
      <Clock className="checkout-meter-icon" aria-hidden="true" />
      <div className="checkout-meter-text">
        <b>{title}</b>
        {children ? <p>{children}</p> : null}
      </div>
      {time ? (
        <span className="checkout-meter-time" dir="ltr">
          {time}
        </span>
      ) : null}
      <span className="checkout-meter-bar" aria-hidden="true">
        <span style={{ transform: `scaleX(${left})` }} />
      </span>
    </div>
  );
}
