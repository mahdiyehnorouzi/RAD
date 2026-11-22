import { ApiError, isNetworkError, readableErrorMessage } from "@/lib/api";
import { toLatinDigits } from "@/lib/payment/receipt";
import type { MessageKey } from "@/i18n/fa";

/**
 * Mirrors `RESEND_COOLDOWN_MS` in `apps/api/src/auth/otp.service.ts`. The API
 * enforces the real cooldown (`otp_cooldown`); this only keeps the resend
 * button from inviting a request the API would refuse.
 */
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

/** The API sends six-digit codes (`generateVerificationCode`). */
export const OTP_CODE_LENGTH = 6;

/**
 * Display name `AuthService.signInWithPhone` stores on a brand-new OTP
 * account. Checkout may replace it with the name the customer just typed;
 * any other name belongs to an existing account and is left alone.
 */
export const NEW_OTP_ACCOUNT_NAME = "مشتری رَد";

type AuthStage = "password" | "otpRequest" | "otpSignIn";

/** Structured API codes from `AuthService` and `OtpService`, in the active language. */
const AUTH_ERROR_CODE: Partial<Record<string, MessageKey>> = {
  account_exists: "accountExists",
  account_missing: "accountMissing",
  bad_credentials: "loginCredentials",
  account_inactive: "accountInactive",
  phone_invalid: "phoneInvalid",
  otp_cooldown: "otpCooldown",
  otp_rate_limited: "otpRateLimited",
  otp_invalid: "otpInvalidCode",
  otp_expired: "otpExpired",
  otp_too_many_attempts: "otpTooManyAttempts",
};

const STAGE_FALLBACK: Record<AuthStage, MessageKey> = {
  password: "authRequestFailed",
  otpRequest: "otpSendFailed",
  otpSignIn: "authRequestFailed",
};

export function authErrorCode(error: unknown) {
  return error instanceof ApiError ? error.code : undefined;
}

/**
 * Known codes stay in the active language. Throttling and a failed SMS send
 * get their own copy; anything else falls back to the API's Persian text or
 * the stage's generic message, never validator output or stack text.
 */
export function authErrorMessage(
  error: unknown,
  stage: AuthStage,
  text: (key: MessageKey) => string,
) {
  const fallback = text(STAGE_FALLBACK[stage]);
  if (isNetworkError(error)) return fallback;
  const code = authErrorCode(error);
  const key = code ? AUTH_ERROR_CODE[code] : undefined;
  if (key) return text(key);
  if (error instanceof ApiError) {
    if (error.status === 429 && stage !== "password") {
      return text("otpRateLimited");
    }
    // The SMS provider failing is a 500 with Persian text and no code.
    if (error.status >= 500) return fallback;
  }
  return readableErrorMessage(error, fallback);
}

/**
 * A request refused only because a code was sent moments ago still means a
 * code is on its way to that phone, so the form moves on to the code step.
 */
export function otpCodeAlreadySent(error: unknown) {
  return authErrorCode(error) === "otp_cooldown";
}

/** Latin digits only, or `null` when it is not a six-digit code. */
export function normalizeOtpCode(raw: string) {
  const digits = toLatinDigits(raw).replace(/\D/g, "");
  return digits.length === OTP_CODE_LENGTH ? digits : null;
}

/** What the code input shows while typing: Latin digits, at most six. */
export function otpCodeDraft(raw: string) {
  return toLatinDigits(raw).replace(/\D/g, "").slice(0, OTP_CODE_LENGTH);
}

export function emptyOtpCells() {
  return Array.from({ length: OTP_CODE_LENGTH }, () => "");
}

/** Latin digits already stored in the six cells, joined. */
export function otpCodeFromCells(cells: readonly string[]) {
  return cells.join("").slice(0, OTP_CODE_LENGTH);
}

/**
 * Typing, pasting, or a platform autofill that drops the whole code into
 * one cell. A full code always fills from the first cell. A shorter paste
 * fills forward from the cell that received it.
 */
export function applyOtpInput(
  cells: readonly string[],
  index: number,
  raw: string,
) {
  const digits = otpCodeDraft(raw);
  const next = emptyOtpCells();
  for (let i = 0; i < OTP_CODE_LENGTH; i += 1) next[i] = cells[i] ?? "";

  if (digits.length >= OTP_CODE_LENGTH) {
    for (let i = 0; i < OTP_CODE_LENGTH; i += 1) next[i] = digits[i] ?? "";
    return {
      cells: next,
      focus: OTP_CODE_LENGTH - 1,
      complete: true,
    };
  }

  if (digits.length === 0) {
    next[index] = "";
    return { cells: next, focus: index, complete: false };
  }

  if (digits.length === 1) {
    next[index] = digits;
    const code = otpCodeFromCells(next);
    return {
      cells: next,
      focus: Math.min(index + 1, OTP_CODE_LENGTH - 1),
      complete: code.length === OTP_CODE_LENGTH,
    };
  }

  for (let i = 0; i < digits.length && index + i < OTP_CODE_LENGTH; i += 1) {
    next[index + i] = digits[i] ?? "";
  }
  const filled = Math.min(index + digits.length, OTP_CODE_LENGTH);
  return {
    cells: next,
    focus: Math.min(filled, OTP_CODE_LENGTH - 1),
    complete: otpCodeFromCells(next).length === OTP_CODE_LENGTH,
  };
}

/** Backspace clears the current cell, or the previous cell when this one is empty. */
export function applyOtpBackspace(cells: readonly string[], index: number) {
  const next = emptyOtpCells();
  for (let i = 0; i < OTP_CODE_LENGTH; i += 1) next[i] = cells[i] ?? "";
  if (next[index]) {
    next[index] = "";
    return { cells: next, focus: index };
  }
  const focus = Math.max(0, index - 1);
  next[focus] = "";
  return { cells: next, focus };
}
