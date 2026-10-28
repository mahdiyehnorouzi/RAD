"use client";

import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCommerce } from "@/components/commerce";
import { useLocale } from "@/components/i18n";
import {
  ApiError,
  errorMessage,
  readableErrorMessage,
  requestPasswordReset,
  resetAccountPassword,
} from "@/lib/api";
import type { MessageKey } from "@/i18n/fa";
import { normalizeIranianMobile } from "@/lib/phone";
import "./account-page.css";

type AuthMethod = "otp" | "password";
type PasswordMode = "signin" | "signup" | "forgot" | "reset";
type OtpStep = "phone" | "code";

const AUTH_ERROR_CODE: Record<string, MessageKey> = {
  account_exists: "accountExists",
  account_missing: "accountMissing",
  bad_credentials: "loginCredentials",
  account_inactive: "accountInactive",
  phone_invalid: "phoneInvalid",
  otp_cooldown: "otpCooldown",
  otp_invalid: "otpInvalidCode",
  otp_expired: "otpExpired",
  otp_too_many_attempts: "otpTooManyAttempts",
};

const RESEND_COOLDOWN_SECONDS = 60;

function safeReturnTo(value?: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/account";
  return value;
}

export function AccountLogin({ returnTo }: { returnTo?: string }) {
  return (
    <Suspense>
      <AccountLoginForm returnTo={returnTo} />
    </Suspense>
  );
}

function AccountLoginForm({ returnTo }: { returnTo?: string }) {
  const { login, register, requestOtp, signInWithOtp } = useCommerce();
  const { locale, t, href } = useLocale();
  const router = useRouter();
  const search = useSearchParams();
  const nextPath = safeReturnTo(returnTo ?? search.get("returnTo"));

  const [method, setMethod] = useState<AuthMethod>("otp");
  const [passwordMode, setPasswordMode] = useState<PasswordMode>(
    search.get("mode") === "signup" ? "signup" : "signin",
  );
  const [otpStep, setOtpStep] = useState<OtpStep>("phone");
  const [phone, setPhone] = useState("");
  const [sentPhone, setSentPhone] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const isSignup = passwordMode === "signup";
  const pageTitle = locale === "fa" ? "حساب کاربری | رَد" : "Account | RAD";

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = window.setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const goNext = () => {
    router.replace(href(nextPath));
  };

  const switchMethod = (next: AuthMethod) => {
    setMethod(next);
    setError("");
    setNotice("");
  };

  const switchPasswordMode = (next: PasswordMode) => {
    setPasswordMode(next);
    setError("");
    setNotice("");
  };

  const sendOtp = async (rawPhone: string) => {
    const normalized = normalizeIranianMobile(rawPhone);
    if (!normalized) {
      setError(t("phoneInvalid"));
      phoneRef.current?.focus();
      return;
    }
    try {
      setError("");
      setBusy(true);
      await requestOtp(normalized);
      setSentPhone(normalized);
      setOtpStep("code");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      const codeKey = err instanceof ApiError ? err.code : undefined;
      const key = codeKey ? AUTH_ERROR_CODE[codeKey] : undefined;
      setError(key ? t(key) : readableErrorMessage(err, t("requestFailed")));
    } finally {
      setBusy(false);
    }
  };

  const handleOtpSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    if (otpStep === "phone") {
      await sendOtp(phone);
      return;
    }
    const data = new FormData(event.currentTarget);
    const code = String(data.get("code") ?? "").trim();
    if (code.length < 4) {
      setError(t("otpInvalidCode"));
      codeRef.current?.focus();
      return;
    }
    try {
      setError("");
      setBusy(true);
      await signInWithOtp({ phone: sentPhone, code });
      goNext();
    } catch (err) {
      const codeKey = err instanceof ApiError ? err.code : undefined;
      const key = codeKey ? AUTH_ERROR_CODE[codeKey] : undefined;
      setError(key ? t(key) : readableErrorMessage(err, t("requestFailed")));
      codeRef.current?.focus();
    } finally {
      setBusy(false);
    }
  };

  const changePhone = () => {
    setOtpStep("phone");
    setSentPhone("");
    setError("");
    setNotice("");
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const code = String(data.get("code") ?? "").trim();
    if (busy) return;

    if (passwordMode === "forgot") {
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        setError(t("emailInvalid"));
        emailRef.current?.focus();
        return;
      }
      try {
        setError("");
        setBusy(true);
        await requestPasswordReset(email);
        setResetEmail(email);
        setNotice(t("resetSent"));
        setPasswordMode("reset");
      } catch (err) {
        setError(errorMessage(err, t("requestFailed")));
      } finally {
        setBusy(false);
      }
      return;
    }

    if (passwordMode === "reset") {
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        setError(t("emailInvalid"));
        emailRef.current?.focus();
        return;
      }
      if (code.length < 4) {
        setError(t("requestFailed"));
        return;
      }
      if (password.length < 8) {
        setError(t("passwordTooShort"));
        return;
      }
      try {
        setError("");
        setBusy(true);
        await resetAccountPassword({ email, code, password });
        await login({ email, password });
        goNext();
      } catch (err) {
        setError(errorMessage(err, t("requestFailed")));
      } finally {
        setBusy(false);
      }
      return;
    }

    if (isSignup && !name) {
      setError(t("nameError"));
      nameRef.current?.focus();
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError(t("emailInvalid"));
      emailRef.current?.focus();
      return;
    }
    if (password.length < 8) {
      setError(t("passwordTooShort"));
      return;
    }
    try {
      setError("");
      setBusy(true);
      if (isSignup) await register({ name, email, password });
      else await login({ email, password });
      goNext();
    } catch (err) {
      const codeKey = err instanceof ApiError ? err.code : undefined;
      const key = codeKey ? AUTH_ERROR_CODE[codeKey] : undefined;
      if (codeKey === "account_exists") setPasswordMode("signin");
      setError(key ? t(key) : errorMessage(err, t("requestFailed")));
      emailRef.current?.focus();
    } finally {
      setBusy(false);
    }
  };

  const titleKey =
    method === "password" && passwordMode === "forgot"
      ? "forgotPasswordTitle"
      : method === "password" && passwordMode === "reset"
        ? "resetPasswordTitle"
        : method === "password" && isSignup
          ? "signupTitle"
          : "loginTitle";
  const bodyKey =
    method === "password" && passwordMode === "forgot"
      ? "forgotPasswordBody"
      : method === "password" && passwordMode === "reset"
        ? "resetPasswordBody"
        : method === "password" && isSignup
          ? "signupBody"
          : "loginBody";

  const showMethodTabs =
    method === "otp" || passwordMode === "signin" || passwordMode === "signup";

  return (
    <>
      <title>{pageTitle}</title>
      <section className="account-page section">
        <div className="auth-copy">
          <span className="eyebrow">{t("accountEyebrow")}</span>
          <h1>{t(titleKey)}</h1>
          <p>{t(bodyKey)}</p>
          <small>{t("localAccountNote")}</small>
        </div>

        <div className="auth-form">
          {showMethodTabs ? (
            <div className="auth-method-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={method === "otp"}
                className={method === "otp" ? "active" : ""}
                onClick={() => switchMethod("otp")}
              >
                {t("otpTab")}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={method === "password"}
                className={method === "password" ? "active" : ""}
                onClick={() => switchMethod("password")}
              >
                {t("passwordTab")}
              </button>
            </div>
          ) : null}

          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p className="form-notice" role="status">
              {notice}
            </p>
          ) : null}

          {method === "otp" ? (
            <form className="auth-stack" onSubmit={handleOtpSubmit} noValidate>
              {otpStep === "phone" ? (
                <>
                  <label htmlFor="login-phone">{t("loginPhoneLabel")}</label>
                  <input
                    ref={phoneRef}
                    id="login-phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    dir="ltr"
                    placeholder={t("phonePlaceholder")}
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    required
                  />
                  <small>{t("otpHint")}</small>
                  <button className="button" type="submit" disabled={busy}>
                    {busy ? t("submitting") : t("sendOtpCode")}
                  </button>
                </>
              ) : (
                <>
                  <p className="form-notice" role="status">
                    {t("otpCodeSentTo", { phone: sentPhone })}
                  </p>
                  <label htmlFor="login-code">{t("otpCodeLabel")}</label>
                  <input
                    ref={codeRef}
                    id="login-code"
                    name="code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    dir="ltr"
                    maxLength={6}
                    required
                  />
                  <button className="button" type="submit" disabled={busy}>
                    {busy ? t("submitting") : t("verifyOtpCode")}
                  </button>
                  <div className="auth-otp-actions">
                    <button
                      className="auth-switch"
                      type="button"
                      disabled={busy}
                      onClick={changePhone}
                    >
                      {t("changePhoneNumber")}
                    </button>
                    <button
                      className="auth-switch"
                      type="button"
                      disabled={busy || cooldown > 0}
                      onClick={() => void sendOtp(sentPhone)}
                    >
                      {cooldown > 0
                        ? t("resendOtpIn", { seconds: cooldown })
                        : t("resendOtpCode")}
                    </button>
                  </div>
                </>
              )}

              <div className="auth-divider">
                <span>{t("authDivider")}</span>
              </div>
              <Link className="button outline auth-google" href="/backend/auth/google">
                <GoogleMark />
                {t("continueWithGoogle")}
              </Link>

              <div className="auth-no-account">
                <strong>{t("noAccountNotice")}</strong>
                <span>{t("noAccountBody")}</span>
              </div>
            </form>
          ) : (
            <form className="auth-stack" onSubmit={handlePasswordSubmit} noValidate>
              {passwordMode === "signin" || passwordMode === "signup" ? (
                <div className="auth-tabs" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={passwordMode === "signin"}
                    className={passwordMode === "signin" ? "active" : ""}
                    onClick={() => switchPasswordMode("signin")}
                  >
                    {t("login")}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={passwordMode === "signup"}
                    className={passwordMode === "signup" ? "active" : ""}
                    onClick={() => switchPasswordMode("signup")}
                  >
                    {t("signup")}
                  </button>
                </div>
              ) : null}
              {isSignup ? (
                <>
                  <label htmlFor="login-name">{t("nameLabel")}</label>
                  <input
                    ref={nameRef}
                    id="login-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                  />
                </>
              ) : null}
              <label htmlFor="login-email">{t("emailLabel")}</label>
              <input
                ref={emailRef}
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={passwordMode === "reset" ? resetEmail : undefined}
                required
              />
              {passwordMode === "reset" ? (
                <>
                  <label htmlFor="reset-code">{t("resetCodeLabel")}</label>
                  <input id="reset-code" name="code" type="text" inputMode="numeric" autoComplete="one-time-code" required />
                </>
              ) : null}
              {passwordMode === "forgot" ? null : (
                <>
                  <label htmlFor="login-password">{t("passwordLabel")}</label>
                  <div className="password-field">
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={isSignup || passwordMode === "reset" ? "new-password" : "current-password"}
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                    >
                      {showPassword ? "◉" : "◎"}
                    </button>
                  </div>
                  {passwordMode === "signin" ? (
                    <button className="auth-switch" type="button" onClick={() => switchPasswordMode("forgot")}>
                      {t("forgotPassword")}
                    </button>
                  ) : (
                    <small>{t("passwordHelp")}</small>
                  )}
                </>
              )}
              <button className="button" type="submit" disabled={busy}>
                {busy
                  ? t("submitting")
                  : t(
                      passwordMode === "forgot"
                        ? "sendResetCode"
                        : passwordMode === "reset"
                          ? "resetPassword"
                          : isSignup
                            ? "signup"
                            : "login",
                    )}
              </button>
              {passwordMode === "signin" || passwordMode === "signup" ? null : (
                <button
                  className="auth-switch"
                  type="button"
                  disabled={busy}
                  onClick={() => switchPasswordMode("signin")}
                >
                  {t("backToLogin")}
                </button>
              )}
            </form>
          )}
        </div>
      </section>
    </>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5Z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.4 0-13.8 4.1-17.1 10.2Z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6C29.6 35.1 26.9 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.6 5.1C9.1 39.9 16 44 24 44Z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3a12.4 12.4 0 0 1-4.6 6.3l6.6 5.6C40.9 36.6 44 30.9 44 24c0-1.3-.1-2.7-.4-3.5Z"
      />
    </svg>
  );
}
