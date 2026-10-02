"use client";

import "./checkout-flow.css";

import { Check, CreditCard, ImageUp, PackageCheck, ShoppingBag, UserRound } from "lucide-react";
import { useLocale } from "@/components/i18n";

const icons = [ShoppingBag, UserRound, CreditCard, CreditCard, ImageUp, PackageCheck];

export function PaymentJourney({ current = 3 }: { current?: number }) {
  const { locale, number } = useLocale();
  const labels = locale === "fa"
    ? ["کیسه", "اطلاعات", "پرداخت", "ارسال رسید", "بررسی", "دریافت"]
    : ["Bag", "Details", "Payment", "Receipt", "Review", "Received"];

  return (
    <nav className="payment-journey" aria-label={locale === "fa" ? "جریان خرید" : "Purchase journey"}>
      <ol>
        {labels.map((label, index) => {
          const state = index < current ? "done" : index === current ? "current" : "next";
          const Icon = icons[index];
          return (
            <li key={label} className={`payment-journey-step is-${state}`} aria-current={state === "current" ? "step" : undefined}>
              <span className="payment-journey-line" aria-hidden="true" />
              <span className="payment-journey-dot" aria-hidden="true">
                {state === "done" ? <Check size={14} /> : <Icon size={15} />}
              </span>
              <span className="payment-journey-label"><b>{number(index + 1)}</b>{label}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
