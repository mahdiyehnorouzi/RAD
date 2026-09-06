"use client";

import type { StoreOrderStatus } from "@rad/types";
import {
  STORE_ORDER_PROGRESS,
  isTerminalStoreStatus,
} from "../const";

export function OrderTimeline({
  status,
  stages,
  number,
  label,
  currentLabel,
}: {
  status: StoreOrderStatus;
  stages: string[];
  number: (value: number) => string;
  label: string;
  currentLabel: string;
}) {
  const terminal = isTerminalStoreStatus(status);
  const activeStage = terminal
    ? STORE_ORDER_PROGRESS.length - 1
    : Math.max(0, STORE_ORDER_PROGRESS.indexOf(status));

  return (
    <ol className="order-timeline" aria-label={label}>
      {stages.map((stage, index) => {
        const done = !terminal && index < activeStage;
        const current = !terminal && index === activeStage;
        return (
          <li
            key={stage}
            className={current ? "current" : done ? "complete" : ""}
            aria-current={current ? "step" : undefined}
          >
            <i>{number(index + 1)}</i>
            <span>
              {stage}
              {current ? <b>{currentLabel}</b> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
