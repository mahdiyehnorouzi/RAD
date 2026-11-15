"use client";
import "./checkout-flow.css";

import { useEffect } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  CreditCard,
  ShoppingBag,
  Truck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useLocale } from "@/components/i18n";
import { checkoutCopy } from "../const";

export const CHECKOUT_STEP_IDS = [
  "cart",
  "contact",
  "delivery",
  "payment",
  "result",
] as const;

export type CheckoutStepId = (typeof CHECKOUT_STEP_IDS)[number];

const ICONS: Record<CheckoutStepId, LucideIcon> = {
  cart: ShoppingBag,
  contact: UserRound,
  delivery: Truck,
  payment: CreditCard,
  result: BadgeCheck,
};

/**
 * Purchase stages that exist today: bag, your details, delivery, payment,
 * result. Completed earlier steps can be revisited. Payment is never skipped.
 */
export function CheckoutSteps({
  current,
  onSelect,
}: {
  current: CheckoutStepId;
  onSelect?: (step: CheckoutStepId) => void;
}) {
  const { locale, href } = useLocale();
  const c = checkoutCopy[locale];
  const currentIndex = CHECKOUT_STEP_IDS.indexOf(current);

  useEffect(() => {
    const reveal = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.matches("input, select, textarea")) return;
      const bar = document.querySelector(".checkout-steps");
      if (!bar) return;
      const limit = bar.getBoundingClientRect().bottom + 12;
      requestAnimationFrame(() => {
        const top = target.getBoundingClientRect().top;
        if (top < limit) window.scrollBy(0, top - limit);
      });
    };
    document.addEventListener("focusin", reveal);
    return () => document.removeEventListener("focusin", reveal);
  }, []);

  return (
    <nav className="checkout-steps" aria-label={c.stepsLabel}>
      <ol>
        {CHECKOUT_STEP_IDS.map((id, index) => {
          const state =
            index < currentIndex
              ? "done"
              : index === currentIndex
                ? "current"
                : "next";
          const copy = c.steps[index];
          const Icon = ICONS[id];
          const revisit =
            state === "done" &&
            (id === "cart" ||
              (onSelect && (id === "contact" || id === "delivery")));
          const status =
            state === "done"
              ? ` (${c.stepDone})`
              : state === "current"
                ? ` (${c.stepCurrent})`
                : "";
          const inner = (
            <>
              <span className="checkout-step-mark" aria-hidden="true">
                <Icon />
              </span>
              <span className="checkout-step-label">
                <span aria-hidden="true">{copy.short}</span>
                <span className="checkout-sr">
                  {copy.label}
                  {status}
                </span>
              </span>
            </>
          );

          return (
            <li
              key={id}
              className={`checkout-step is-${state}`}
              aria-current={state === "current" ? "step" : undefined}
            >
              {id === "cart" && revisit ? (
                <Link className="checkout-step-hit" href={href("/cart")}>
                  {inner}
                </Link>
              ) : revisit && onSelect ? (
                <button
                  type="button"
                  className="checkout-step-hit"
                  onClick={() => onSelect(id)}
                >
                  {inner}
                </button>
              ) : (
                <span className="checkout-step-hit">{inner}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
