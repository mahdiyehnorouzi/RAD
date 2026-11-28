"use client";

import "./otp-code-input.css";
import { OTP_CODE_LENGTH, emptyOtpCells, otpCodeDraft } from "./auth-login";

/** One native field for SMS AutoFill and paste, rendered as six visual slots. */
export function OtpCodeInput({
  id,
  value,
  onChange,
  onComplete,
  disabled = false,
  invalid = false,
  labelledBy,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  labelledBy?: string;
}) {
  const activeCell = Math.min(value.length, OTP_CODE_LENGTH - 1);

  return (
    <div className="otp-cells" dir="ltr">
      {emptyOtpCells().map((_, index) => (
        <span
          key={index}
          className="otp-cell"
          data-active={index === activeCell || undefined}
          aria-hidden="true"
        >
          {value[index]}
        </span>
      ))}
      <input
        id={id}
        name="one-time-code"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        enterKeyHint="done"
        value={value}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-labelledby={labelledBy}
        onChange={(event) => {
          const next = otpCodeDraft(event.currentTarget.value);
          onChange(next);
          if (next.length === OTP_CODE_LENGTH && next !== value) {
            onComplete?.(next);
          }
        }}
        onFocus={(event) => {
          if (value.length === OTP_CODE_LENGTH) event.currentTarget.select();
        }}
      />
    </div>
  );
}
