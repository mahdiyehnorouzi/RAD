"use client";

import {
  FormEvent,
  Suspense,
  SVGProps,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCommerce } from "@/components/commerce";
import { useLocale } from "@/components/i18n";
import { requestPasswordReset, resetAccountPassword } from "@/lib/api";
import type { MessageKey } from "@/i18n/fa";
import {
  applyIranMobileEdit,
  canonicalIranMobile,
  formatIranMobileDraft,
} from "@/lib/phone/iran-mobile";
import {
  OTP_RESEND_COOLDOWN_SECONDS,
  authErrorCode,
  authErrorMessage,
  normalizeOtpCode,
  otpCodeAlreadySent,
  otpCodeDraft,
} from "../auth-login";
import "./account-page.css";

type AuthMethod = "otp" | "password";
type PasswordMode = "signin" | "signup" | "forgot" | "reset";
type OtpStep = "phone" | "code";

function safeReturnTo(value?: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//"))
    return "/account";
  return value;
}

function GoogleGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 18 18" width="18" height="18" {...props}>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7a5.4 5.4 0 0 1 0-3.4V4.97H.95a9 9 0 0 0 0 8.06l3-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58Z"
      />
    </svg>
  );
}

/** Error codes `GET /auth/google/callback` appends as `?authError=`. */
const GOOGLE_AUTH_ERROR_CODE: Record<string, MessageKey> = {
  access_denied: "googleAuthCancelled",
  google_oauth_missing_params: "googleAuthFailed",
  google_oauth_state_mismatch: "googleAuthFailed",
  google_oauth_failed: "googleAuthFailed",
  google_email_unverified: "googleAuthFailed",
  account_inactive: "accountInactive",
  google_account_mismatch: "googleAccountMismatch",
};

export function AccountLogin({ returnTo }: { returnTo?: string }) {
  return (
    <Suspense>
      <AccountLoginForm returnTo={returnTo} />
    </Suspense>
  );
}

function AccountLoginForm({ returnTo }: { returnTo?: string }) {
  const { login, register, requestOtp, signInWithOtp } = useCommerce();
  const { locale, t, href, number } = useLocale();
  const router = useRouter();
  const search = useSearchParams();
  const nextPath = safeReturnTo(returnTo ?? search.get("returnTo"));
  const signupLink = search.get("mode") === "signup";

  // OTP first; a `?mode=signup` link still lands on email sign-up.
  const [method, setMethod] = useState<AuthMethod>(
    signupLink ? "password" : "otp",
  );
  const [passwordMode, setPasswordMode] = useState<PasswordMode>(
    signupLink ? "signup" : "signin",
  );
  const [otpStep, setOtpStep] = useState<OtpStep>("phone");
  const [phone, setPhone] = useState("");
  const [sentPhone, setSentPhone] = useState("");
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(() => {
    const authError = search.get("authError");
    return authError
      ? t(GOOGLE_AUTH_ERROR_CODE[authError] ?? "googleAuthFailed")
      : "";
  });
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
    const timer = window.setTimeout(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (method === "otp" && otpStep === "code") codeRef.current?.focus();
  }, [method, otpStep]);

  const goNext = () => {
    router.replace(href(nextPath));
  };

  const clearMessages = () => {
    setError("");
    setNotice("");
  };

  const switchMethod = (next: AuthMethod) => {
    setMethod(next);
    clearMessages();
  };

  const switchPasswordMode = (next: PasswordMode) => {
    setPasswordMode(next);
    clearMessages();
  };

  const toCodeStep = (normalized: string) => {
    setSentPhone(normalized);
    setCode("");
    setOtpStep("code");
    setCooldown(OTP_RESEND_COOLDOWN_SECONDS);
  };

  const sendOtp = async (rawPhone: string) => {
    const normalized = canonicalIranMobile(rawPhone);
    if (!normalized) {
      setNotice("");
      setError(t("phoneInvalid"));
      phoneRef.current?.focus();
      return;
    }
    try {
      clearMessages();
      setBusy(true);
      await requestOtp(normalized);
      toCodeStep(normalized);
      if (otpStep === "code") setNotice(t("otpResent"));
    } catch (err) {
      if (otpCodeAlreadySent(err)) {
        // A code for this phone is already on its way; let it be entered.
        if (otpStep === "phone") toCodeStep(normalized);
        else setCooldown(OTP_RESEND_COOLDOWN_SECONDS);
      }
      setError(authErrorMessage(err, "otpRequest", t));
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
    const normalizedCode = normalizeOtpCode(code);
    if (!normalizedCode) {
      setNotice("");
      setError(t("otpCodeInvalidFormat"));
      codeRef.current?.focus();
      return;
    }
    try {
      clearMessages();
      setBusy(true);
      await signInWithOtp({ phone: sentPhone, code: normalizedCode });
      goNext();
    } catch (err) {
      setError(authErrorMessage(err, "otpSignIn", t));
      setCode("");
      codeRef.current?.focus();
    } finally {
      setBusy(false);
    }
  };

  const changePhone = () => {
    setOtpStep("phone");
    setSentPhone("");
    setCode("");
    clearMessages();
    window.requestAnimationFrame(() => phoneRef.current?.focus());
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const resetCode = String(data.get("code") ?? "").trim();
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
        setError(authErrorMessage(err, "password", t));
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
      if (resetCode.length < 4) {
        setError(t("authRequestFailed"));
        return;
      }
      if (password.length < 8) {
        setError(t("passwordTooShort"));
        return;
      }
      try {
        setError("");
        setBusy(true);
        await resetAccountPassword({ email, code: resetCode, password });
        await login({ email, password });
        goNext();
      } catch (err) {
        setError(authErrorMessage(err, "password", t));
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
      if (authErrorCode(err) === "account_exists") setPasswordMode("signin");
      setError(authErrorMessage(err, "password", t));
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
  const [sentBefore, sentAfter = ""] = t("otpCodeSentTo").split("{phone}");

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
            <div
              className="auth-method-tabs"
              role="tablist"
              aria-label={t("authMethodLabel")}
            >
              <button
                type="button"
                role="tab"
                aria-selected={method === "otp"}
                className={method === "otp" ? "active" : ""}
                disabled={busy}
                onClick={() => switchMethod("otp")}
              >
                {t("otpTab")}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={method === "password"}
                className={method === "password" ? "active" : ""}
                disabled={busy}
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

          {passwordMode === "signin" || passwordMode === "signup" ? (
            <>
              <a
                className="button outline auth-google"
                href={`/backend/auth/google?from=${encodeURIComponent(href(nextPath))}`}
              >
                <GoogleGlyph aria-hidden="true" />
                <span>{t("continueWithGoogle")}</span>
              </a>
              <div
                className="auth-divider"
                role="separator"
                aria-label={t("authDivider")}
              >
                <span>{t("authDivider")}</span>
              </div>
            </>
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
                    onChange={(event) => {
                      const input = event.currentTarget;
                      const next = applyIranMobileEdit(
                        phone,
                        input.value,
                        input.selectionStart ?? input.value.length,
                      );
                      setPhone(next.value);
                      window.requestAnimationFrame(() => {
                        if (document.activeElement === input) {
                          input.setSelectionRange(next.cursor, next.cursor);
                        }
                      });
                    }}
                    aria-describedby="login-phone-hint"
                    required
                  />
                  <small id="login-phone-hint">{t("otpHint")}</small>
                  <button
                    className="button"
                    type="submit"
                    disabled={busy}
                    aria-busy={busy}
                  >
                    {busy ? t("submitting") : t("sendOtpCode")}
                  </button>
                </>
              ) : (
                <>
                  <p className="auth-otp-sent">
                    {sentBefore}
                    <bdi dir="ltr">{formatIranMobileDraft(sentPhone)}</bdi>
                    {sentAfter}
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
                    maxLength={10}
                    value={code}
                    onChange={(event) =>
                      setCode(otpCodeDraft(event.currentTarget.value))
                    }
                    required
                  />
                  <button
                    className="button"
                    type="submit"
                    disabled={busy}
                    aria-busy={busy}
                  >
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
                        ? t("resendOtpIn", { seconds: number(cooldown) })
                        : t("resendOtpCode")}
                    </button>
                  </div>
                </>
              )}

              <div className="auth-no-account">
                <strong>{t("noAccountNotice")}</strong>
                <span>{t("noAccountBody")}</span>
              </div>
            </form>
          ) : (
            <form
              className="auth-stack"
              onSubmit={handlePasswordSubmit}
              noValidate
            >
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
                  <input
                    id="reset-code"
                    name="code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                  />
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
                      autoComplete={
                        isSignup || passwordMode === "reset"
                          ? "new-password"
                          : "current-password"
                      }
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={
                        showPassword ? t("hidePassword") : t("showPassword")
                      }
                    >
                      {showPassword ? "◉" : "◎"}
                    </button>
                  </div>
                  {passwordMode === "signin" ? (
                    <button
                      className="auth-switch"
                      type="button"
                      onClick={() => switchPasswordMode("forgot")}
                    >
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
