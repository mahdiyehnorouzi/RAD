import * as React from "react";
import type { ButtonHTMLAttributes } from "react";
import "./button.css";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "link";
export type ButtonSize = "sm" | "md";
export type ButtonShape = "default" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: React.Ref<HTMLButtonElement>;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** "icon" renders a square, label-less control; `aria-label` is required in that case. */
  shape?: ButtonShape;
  /** Stretches the button to its container's width and left-aligns content (nav/menu rows). */
  fullWidth?: boolean;
  /** Shows a spinner and disables the button without changing its label's layout. */
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  shape = "default",
  fullWidth = false,
  loading = false,
  disabled,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  if (process.env.NODE_ENV !== "production" && shape === "icon" && !props["aria-label"] && !props["aria-labelledby"]) {
    console.warn("Button: shape=\"icon\" requires an aria-label.");
  }

  const classes = [
    "rad-button",
    `rad-button-${variant}`,
    `rad-button-${size}`,
    shape === "icon" ? "rad-button-icon" : "",
    fullWidth ? "rad-button-full" : "",
    loading ? "rad-button-loading" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    />
  );
}
