"use client";

import { FormEvent, Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCommerce } from "@/components/commerce";
import { useLocale } from "@/components/i18n";
import { ApiError, errorMessage, requestPasswordReset, resetAccountPassword } from "@/lib/api";
import type { MessageKey } from "@/i18n/fa";
import "./account-page.css";

type AuthMode = "signin" | "signup" | "forgot" | "reset";

const AUTH_ERROR_CODE: Record<string, MessageKey> = {
  account_exists: "accountExists",
  account_missing: "accountMissing",
  bad_credentials: "loginCredentials",
  account_inactive: "accountInactive",
};

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
  const { login, register } = useCommerce();
  const { locale, t, href } = useLocale();
  const router = useRouter();
  const search = useSearchParams();
  const nextPath = safeReturnTo(returnTo ?? search.get("returnTo"));
  const [mode, setMode] = useState<AuthMode>(
    search.get("mode") === "signup" ? "signup" : "signin",
  );
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const isSignup = mode === "signup";
  const pageTitle = locale === "fa" ? "حساب کاربری | رَد" : "Account | RAD";

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError("");
    setNotice("");
  };

  const goNext = () => {
    router.replace(href(nextPath));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const code = String(data.get("code") ?? "").trim();
    if (busy) return;

    if (mode === "forgot") {
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
        setMode("reset");
      } catch (err) {
        setError(errorMessage(err, t("requestFailed")));
      } finally {
        setBusy(false);
      }
      return;
    }

    if (mode === "reset") {
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
      if (codeKey === "account_exists") setMode("signin");
      setError(key ? t(key) : errorMessage(err, t("requestFailed")));
      emailRef.current?.focus();
    } finally {
      setBusy(false);
    }
  };

  const titleKey =
    mode === "forgot"
      ? "forgotPasswordTitle"
      : mode === "reset"
        ? "resetPasswordTitle"
        : isSignup
          ? "signupTitle"
          : "loginTitle";
  const bodyKey =
    mode === "forgot"
      ? "forgotPasswordBody"
      : mode === "reset"
        ? "resetPasswordBody"
        : isSignup
          ? "signupBody"
          : "loginBody";

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
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {mode === "signin" || mode === "signup" ? (
            <div className="auth-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "signin"}
                className={mode === "signin" ? "active" : ""}
                onClick={() => switchMode("signin")}
              >
                {t("login")}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "signup"}
                className={mode === "signup" ? "active" : ""}
                onClick={() => switchMode("signup")}
              >
                {t("signup")}
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
            defaultValue={mode === "reset" ? resetEmail : undefined}
            required
          />
          {mode === "reset" ? (
            <>
              <label htmlFor="reset-code">{t("resetCodeLabel")}</label>
              <input id="reset-code" name="code" type="text" inputMode="numeric" autoComplete="one-time-code" required />
            </>
          ) : null}
          {mode === "forgot" ? null : (
            <>
              <label htmlFor="login-password">{t("passwordLabel")}</label>
              <div className="password-field">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isSignup || mode === "reset" ? "new-password" : "current-password"}
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
              {mode === "signin" ? (
                <button className="auth-switch" type="button" onClick={() => switchMode("forgot")}>
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
                  mode === "forgot"
                    ? "sendResetCode"
                    : mode === "reset"
                      ? "resetPassword"
                      : isSignup
                        ? "signup"
                        : "login",
                )}
          </button>
          {mode === "signin" || mode === "signup" ? null : (
            <button className="auth-switch" type="button" disabled={busy} onClick={() => switchMode("signin")}>
              {t("backToLogin")}
            </button>
          )}
        </form>
      </section>
    </>
  );
}
