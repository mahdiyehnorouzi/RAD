"use client";

import { useRef } from "react";
import "./otp-code-input.css";
import {
  OTP_CODE_LENGTH,
  applyOtpBackspace,
  applyOtpInput,
  emptyOtpCells,
  otpCodeFromCells,
} from "./auth-login";

/**
 * Six cells for one verification code.
 * The first cell is the platform autofill target (`autocomplete="one-time-code"`).
 * A full code typed, pasted, or inserted by the browser is split across the cells.
 * This does not read SMS messages or write them to the clipboard.
 */
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
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const cells = emptyOtpCells();
  for (let i = 0; i < OTP_CODE_LENGTH; i += 1) cells[i] = value[i] ?? "";

  const commit = (
    nextCells: readonly string[],
    focus: number,
    complete: boolean,
  ) => {
    const next = otpCodeFromCells(nextCells);
    onChange(next);
    window.requestAnimationFrame(() => {
      refs.current[focus]?.focus();
      refs.current[focus]?.select();
    });
    if (complete) onComplete?.(next);
  };

  return (
    <div
      className="otp-cells"
      role="group"
      aria-labelledby={labelledBy}
      dir="ltr"
    >
      {cells.map((cell, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          id={index === 0 ? id : undefined}
          name={index === 0 ? "one-time-code" : undefined}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="done"
          maxLength={index === 0 ? OTP_CODE_LENGTH : 1}
          value={cell}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-label={`${index + 1} / ${OTP_CODE_LENGTH}`}
          onChange={(event) => {
            const applied = applyOtpInput(
              cells,
              index,
              event.currentTarget.value,
            );
            commit(applied.cells, applied.focus, applied.complete);
          }}
          onKeyDown={(event) => {
            if (event.key === "Backspace") {
              event.preventDefault();
              const applied = applyOtpBackspace(cells, index);
              commit(applied.cells, applied.focus, false);
              return;
            }
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              refs.current[Math.max(0, index - 1)]?.focus();
            }
            if (event.key === "ArrowRight") {
              event.preventDefault();
              refs.current[Math.min(OTP_CODE_LENGTH - 1, index + 1)]?.focus();
            }
          }}
          onPaste={(event) => {
            event.preventDefault();
            const applied = applyOtpInput(
              cells,
              index,
              event.clipboardData.getData("text"),
            );
            commit(applied.cells, applied.focus, applied.complete);
          }}
          onFocus={(event) => event.currentTarget.select()}
        />
      ))}
    </div>
  );
}
