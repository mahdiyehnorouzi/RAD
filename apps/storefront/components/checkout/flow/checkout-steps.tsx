"use client";
import "./checkout-flow.css";

import { useLocale } from "@/components/i18n";
import { checkoutCopy } from "../const";

/** 0 = delivery details, 1 = payment, 2 = receipt. */
export function CheckoutSteps({ current }: { current: 0 | 1 | 2 }) {
  const { locale } = useLocale();
  const c = checkoutCopy[locale];

  return (
    <nav className="checkout-steps" aria-label={c.stepsLabel}>
      <ol>
        {c.steps.map((label, index) => {
          const state =
            index < current ? "done" : index === current ? "current" : "next";
          return (
            <li
              key={label}
              className={`checkout-step is-${state}`}
              aria-current={state === "current" ? "step" : undefined}
            >
              <span className="checkout-step-dot" aria-hidden="true"></span>
              <span className="checkout-step-label">
                {label}
                {state === "next" ? null : (
                  <span className="checkout-sr">
                    {" "}
                    ({state === "done" ? c.stepDone : c.stepCurrent})
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
