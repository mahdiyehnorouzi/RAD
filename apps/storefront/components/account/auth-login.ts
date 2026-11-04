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
const OTP_CODE_LENGTH = 6;

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
