"use client";
import "./purchase-path.css";

import { Fragment, type ReactNode, type Ref } from "react";
import type { PolicySlug } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { policyPath, purchasePathCopy } from "../const";
import { PolicyFacts } from "./policy-facts";

type Props = {
  ref?: Ref<HTMLInputElement>;
  checked: boolean;
  onChange: (checked: boolean) => void;
  invalid?: boolean;
};

/**
 * The rules that matter right before paying, and the tick that records
 * which version of them this order accepted.
 */
export function CheckoutAgreement({ ref, checked, onChange, invalid }: Props) {
  const { locale, href } = useLocale();
  const c = purchasePathCopy[locale];

  const link = (slug: PolicySlug, label: string) => (
    <a href={href(policyPath(slug))} target="_blank" rel="noopener">
      {label}
      <span className="purchase-sr"> {c.newTab}</span>
    </a>
  );
  const links: Record<string, ReactNode> = {
    terms: link("buying", c.agreeTerms),
    shipping: link("shipping", c.agreeShipping),
    returns: link("returns", c.agreeReturns),
    privacy: link("privacy", c.agreePrivacy),
  };
  const sentence = c.agreeSentence.split(/(\{\w+\})/).map((part, index) => {
    const key = part.match(/^\{(\w+)\}$/)?.[1];
    return <Fragment key={index}>{key ? links[key] : part}</Fragment>;
  });

  return (
    <section
      className="checkout-agreement"
      aria-labelledby="checkout-digest-title"
    >
      <h2 id="checkout-digest-title">{c.digestTitle}</h2>
      <PolicyFacts
        facts={[
          { slug: "buying", id: "one-of-one" },
          { slug: "buying", id: "payment-window" },
          { slug: "returns", id: "window", review: true },
          { slug: "returns", id: "damage" },
        ]}
      />
      <label
        className={invalid ? "checkout-agree is-invalid" : "checkout-agree"}
      >
        <input
          ref={ref}
          type="checkbox"
          name="acceptPolicies"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-invalid={invalid || undefined}
          aria-describedby="checkout-agree-note"
          required
        />
        <span>{sentence}</span>
      </label>
      <p id="checkout-agree-note" className="checkout-agree-note">
        {invalid ? c.agreeRequired : c.agreeNote}
      </p>
    </section>
  );
}
