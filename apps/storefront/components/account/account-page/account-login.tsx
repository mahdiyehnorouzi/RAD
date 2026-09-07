"use client";

import { FormEvent, useRef, useState } from "react";
import { useCommerce } from "@/components/commerce";
import { useLocale } from "@/components/i18n";
import { ApiError, errorMessage } from "@/lib/api";
import type { MessageKey } from "@/i18n/fa";
import "./account-page.css";

type AuthMode = "signin" | "signup";

const AUTH_ERROR_CODE: Record<string, MessageKey> = {
  account_exists: "accountExists",
  account_missing: "accountMissing",
  bad_credentials: "loginCredentials",
  account_inactive: "accountInactive",
};

export function AccountLogin() {
  const { login, register } = useCommerce();
  const { locale, t } = useLocale();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const isSignup = mode === "signup";
  const pageTitle = locale === "fa" ? "حساب کاربری | رَد" : "Account | RAD";

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
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
    if (busy) return;
    try {
      setError("");
      setBusy(true);
      if (isSignup) await register({ name, email, password });
      else await login({ email, password });
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined;
      const key = code ? AUTH_ERROR_CODE[code] : undefined;
      if (code === "account_exists") setMode("signin");
      setError(key ? t(key) : errorMessage(err, t("requestFailed")));
      emailRef.current?.focus();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <title>{pageTitle}</title>
      <section className="account-page section">
        <div className="auth-copy">
          <span className="eyebrow">{t("accountEyebrow")}</span>
          <h1>{t(isSignup ? "signupTitle" : "loginTitle")}</h1>
          <p>{t(isSignup ? "signupBody" : "loginBody")}</p>
          <small>{t("localAccountNote")}</small>
        </div>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
          {isSignup ? (
            <>
              <label htmlFor="login-name">{t("nameLabel")}</label>
              <input
                ref={nameRef}
                id="login-name"
                name="name"
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
            required
          />
          <label htmlFor="login-password">{t("passwordLabel")}</label>
          <div className="password-field">
            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={isSignup ? "new-password" : "current-password"}
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
          <small>{t("passwordHelp")}</small>
          <button className="button" type="submit" disabled={busy}>
            {busy ? t("submitting") : t(isSignup ? "signup" : "login")}
          </button>
          <button
            className="auth-switch"
            type="button"
            disabled={busy}
            onClick={() => switchMode(isSignup ? "signin" : "signup")}
          >
            {t(isSignup ? "haveAccount" : "needAccount")}
          </button>
        </form>
      </section>
    </>
  );
}
