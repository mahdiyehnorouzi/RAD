"use client";
import type { ReactNode } from "react";

export function CheckoutField({
  id,
  label,
  optional,
  error,
  hint,
  wide = false,
  children,
}: {
  id: string;
  label: string;
  /** Shown beside the label for fields that may stay empty. */
  optional?: string;
  error?: string;
  hint?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`checkout-field${wide ? " is-wide" : ""}${error ? " is-invalid" : ""}`}>
      <label htmlFor={id}>
        {label}
        {optional ? <small> ({optional})</small> : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="checkout-field-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="checkout-field-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
