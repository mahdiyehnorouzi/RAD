import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { ApiError } from "@/lib/api";
import { canonicalIranMobile } from "@/lib/phone/iran-mobile";
import type { MessageKey } from "@/i18n/fa";
import {
  OTP_RESEND_COOLDOWN_SECONDS,
  authErrorMessage,
  normalizeOtpCode,
  otpCodeAlreadySent,
  otpCodeDraft,
} from "./auth-login";

const here = dirname(fileURLToPath(import.meta.url));
const text = (key: MessageKey) => `t:${key}`;

test("OTP API codes are shown in the active language, not the API's Persian text", () => {
  const cases: Array<[string, MessageKey]> = [
    ["phone_invalid", "phoneInvalid"],
    ["otp_cooldown", "otpCooldown"],
    ["otp_rate_limited", "otpRateLimited"],
    ["otp_invalid", "otpInvalidCode"],
    ["otp_expired", "otpExpired"],
    ["otp_too_many_attempts", "otpTooManyAttempts"],
    ["account_inactive", "accountInactive"],
  ];
  for (const [code, key] of cases) {
    const error = new ApiError("متن فارسی سرور", 400, code);
    assert.equal(authErrorMessage(error, "otpSignIn", text), `t:${key}`);
  }
});

test("password sign-in codes keep their existing messages", () => {
  const cases: Array<[string, MessageKey]> = [
    ["account_exists", "accountExists"],
    ["account_missing", "accountMissing"],
    ["bad_credentials", "loginCredentials"],
    ["account_inactive", "accountInactive"],
  ];
  for (const [code, key] of cases) {
    const error = new ApiError("x", 401, code);
    assert.equal(authErrorMessage(error, "password", text), `t:${key}`);
  }
});

test("technical errors never reach the screen", () => {
  const validator = new ApiError(
    "phone must be longer than 10 characters",
    400,
  );
  assert.equal(
    authErrorMessage(validator, "otpRequest", text),
    "t:otpSendFailed",
  );
  assert.equal(
    authErrorMessage(new Error("TypeError: fetch failed"), "otpSignIn", text),
    "t:authRequestFailed",
  );
  assert.equal(
    authErrorMessage(new ApiError("offline", 0, "network"), "password", text),
    "t:authRequestFailed",
  );
  assert.equal(
    authErrorMessage(new ApiError("timeout", 0, "timeout"), "otpRequest", text),
    "t:otpSendFailed",
  );
});

test("a failed SMS send and throttling get their own copy", () => {
  const smsDown = new ApiError(
    "ارسال پیامک ناموفق بود. دوباره تلاش کنید.",
    500,
  );
  assert.equal(
    authErrorMessage(smsDown, "otpRequest", text),
    "t:otpSendFailed",
  );
  const throttled = new ApiError("ThrottlerException: Too Many Requests", 429);
  assert.equal(
    authErrorMessage(throttled, "otpRequest", text),
    "t:otpRateLimited",
  );
  assert.equal(
    authErrorMessage(throttled, "otpSignIn", text),
    "t:otpRateLimited",
  );
});

test("uncoded Persian API text still passes through, as elsewhere in the account", () => {
  const error = new ApiError("کد بازیابی نادرست است.", 400);
  assert.equal(
    authErrorMessage(error, "password", text),
    "کد بازیابی نادرست است.",
  );
});

test("only a cooldown refusal means a code is already on its way", () => {
  assert.equal(
    otpCodeAlreadySent(new ApiError("x", 400, "otp_cooldown")),
    true,
  );
  assert.equal(
    otpCodeAlreadySent(new ApiError("x", 400, "otp_rate_limited")),
    false,
  );
  assert.equal(otpCodeAlreadySent(new Error("otp_cooldown")), false);
});

test("the code accepts Persian and Arabic digits, within the API's 4-10 digit bound", () => {
  assert.equal(normalizeOtpCode("۱۲۳۴۵۶"), "123456");
  assert.equal(normalizeOtpCode("١٢٣٤٥٦"), "123456");
  assert.equal(normalizeOtpCode(" 123 456 "), "123456");
  // Below the API's OtpVerifyDto minimum (4).
  assert.equal(normalizeOtpCode("123"), null);
  // A 6-digit code (the provider's typical length) and a shorter/longer
  // one within the DTO's 4-10 bound must both be accepted — the client
  // must not assume a fixed length the provider doesn't guarantee.
  assert.equal(normalizeOtpCode("1234567"), "1234567");
  assert.equal(normalizeOtpCode("1234"), "1234");
  // Above the API's OtpVerifyDto maximum (10).
  assert.equal(normalizeOtpCode("12345678901"), null);
  assert.equal(otpCodeDraft("۱۲a۳-۴۵۶۷۸۹۰۱"), "1234567890");
});

test("the phone sent to the API is the canonical 09 form the API accepts", () => {
  // The API's `normalizeIranianMobile` accepts only `09` and nine digits
  // (after stripping +98/0098), so the client must never send anything else.
  for (const raw of [
    "0912 345 6789",
    "+989123456789",
    "۰۹۱۲۳۴۵۶۷۸۹",
    "9123456789",
  ]) {
    assert.match(canonicalIranMobile(raw) ?? "", /^09\d{9}$/);
  }
  assert.equal(canonicalIranMobile("0212345678"), null);
});

test("the resend cooldown matches the API's resend cooldown", () => {
  const otpService = readFileSync(
    join(here, "../../../api/src/auth/otp.service.ts"),
    "utf8",
  );
  const match = otpService.match(/RESEND_COOLDOWN_MS = (\d+) \* 1000/);
  assert.ok(match, "RESEND_COOLDOWN_MS not found in otp.service.ts");
  assert.equal(Number(match[1]), OTP_RESEND_COOLDOWN_SECONDS);
});

test("the login form signs in through /auth/otp/signin, unaffected by Google sign-in", () => {
  const provider = readFileSync(
    join(here, "../commerce/commerce-provider/commerce-provider.tsx"),
    "utf8",
  );
  assert.match(provider, /"\/auth\/otp\/request"/);
  assert.match(provider, /"\/auth\/otp\/signin"/);
  assert.doesNotMatch(provider, /"\/auth\/otp\/verify"/);
});

/**
 * The Google sign-in link must go through the storefront's own
 * `/backend/*` proxy (`app/backend/[...path]/route.ts`), never straight at
 * the API's own origin — that's what makes the session cookie the
 * callback eventually sets land on the storefront's domain, the one every
 * other `/backend/*` call already reads from (see `.env.example`'s
 * `GOOGLE_CALLBACK_URL` note). A link built from a bare "/auth/google"
 * (no "/backend" prefix) would silently break this.
 */
test("the Google sign-in link is same-origin, through the /backend proxy", () => {
  const login = readFileSync(
    join(here, "account-page/account-login.tsx"),
    "utf8",
  );
  assert.match(login, /\/backend\/auth\/google\?from=/);
  assert.doesNotMatch(login, /href=\{`https?:\/\//);
});
