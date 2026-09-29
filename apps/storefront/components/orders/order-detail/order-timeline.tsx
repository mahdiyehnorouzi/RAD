import { Check } from "lucide-react";
import type { Order, StoreOrderStatus } from "@rad/types";
import { STORE_ORDER_PROGRESS } from "../const";

/** When the order entered each stage, where the order records it. */
function stageTimes(order: Order): Partial<Record<StoreOrderStatus, number>> {
  return {
    pending_payment: order.createdAt,
    pending_verification: order.payment?.submittedAt,
    confirmed: order.payment?.reviewedAt,
    delivered: order.deliveredAt,
  };
}

export function OrderTimeline({
  id,
  order,
  stages,
  number,
  label,
  currentLabel,
  formatTime,
}: {
  id: string;
  order: Order;
  stages: string[];
  number: (value: number) => string;
  label: string;
  currentLabel: string;
  formatTime: (value: number) => string;
}) {
  const activeStage = Math.max(0, STORE_ORDER_PROGRESS.indexOf(order.status));
  const times = stageTimes(order);

  return (
    <section id={id} className="track-card track-progress" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="track-eyebrow">
        {label}
      </h2>
      <ol className="track-steps">
        {stages.map((stage, index) => {
          const done = index < activeStage;
          const current = index === activeStage;
          const time = done || current ? times[STORE_ORDER_PROGRESS[index]] : undefined;
          return (
            <li
              key={stage}
              className={current ? "is-current" : done ? "is-done" : undefined}
              aria-current={current ? "step" : undefined}
            >
              <span className="track-step-check">
                {done ? <Check aria-hidden="true" /> : null}
              </span>
              <i>{number(index + 1)}</i>
              <span className="track-step-copy">
                <b>{stage}</b>
                {current ? <em>{currentLabel}</em> : null}
                {time && !current ? <time dateTime={new Date(time).toISOString()}>{formatTime(time)}</time> : null}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
