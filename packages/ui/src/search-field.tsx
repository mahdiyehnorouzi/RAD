import * as React from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import "./search-field.css";

export interface AdminSearchFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange" | "size"
> {
  ref?: React.Ref<HTMLInputElement>;
  value: string;
  onChange: (value: string) => void;
  /** Leading icon, e.g. `<Search />` from lucide-react. The consumer owns
   * the icon import so this package doesn't need an icon-library
   * dependency of its own. */
  icon?: ReactNode;
  /** Accessible label for the clear button; required whenever `value` can
   * be non-empty (a console warning fires otherwise, mirroring Button's
   * icon-only a11y check). */
  clearLabel?: string;
  className?: string;
}

/**
 * The one search input shape for the admin panel: icon + input + a clear
 * button that appears once there's something to clear. Every admin list
 * search (products, orders, custom orders, QR/tags, customers, messages)
 * should render this instead of its own `<input>`, so they share focus
 * styling, RTL layout, and the 16px minimum font size that keeps iOS
 * Safari from zooming the page on focus.
 */
export function AdminSearchField({
  value,
  onChange,
  icon,
  clearLabel = "پاک کردن جست‌وجو",
  className = "",
  ref,
  ...props
}: AdminSearchFieldProps) {
  if (process.env.NODE_ENV !== "production" && value && !clearLabel) {
    console.warn(
      "AdminSearchField: clearLabel is required once value can be non-empty.",
    );
  }

  return (
    <div className={`rad-search-field${className ? ` ${className}` : ""}`}>
      {icon ? (
        <span className="rad-search-field-icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        {...props}
      />
      {value ? (
        <button
          type="button"
          className="rad-search-field-clear"
          onClick={() => onChange("")}
          aria-label={clearLabel}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M18 6 6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
