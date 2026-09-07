"use client";

import { FormEvent, useRef, useState } from "react";
import { useCommerce } from "@/components/commerce";
import { useLocale } from "@/components/i18n";
import "./account-page.css";

export function AccountLogin() {
  const { login } = useCommerce();
  const { locale, t } = useLocale();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const pageTitle = locale === "fa" ? "حساب کاربری | رَد" : "Account | RAD";

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
      setError(t("loginError"));
      nameRef.current?.focus();
      return;
    }
    try {
      setError("");
      await login({ name, email, password });
    } catch {
      setError(t("loginError"));
      nameRef.current?.focus();
    }
  };

  return (
    <>
      <title>{pageTitle}</title>
      <section className="account-page section">
        <div className="auth-copy">
          <span className="eyebrow">{t("accountEyebrow")}</span>
          <h1>{t("loginTitle")}</h1>
          <p>{t("loginBody")}</p>
          <small>{t("localAccountNote")}</small>
        </div>
        <form className="auth-form" onSubmit={handleLogin} noValidate>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <label htmlFor="login-name">{t("nameLabel")}</label>
          <input
            ref={nameRef}
            id="login-name"
            name="name"
            autoComplete="name"
            required
          />
          <label htmlFor="login-email">{t("emailLabel")}</label>
          <input
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
              autoComplete="current-password"
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
          <button className="button" type="submit">
            {t("login")}
          </button>
        </form>
      </section>
    </>
  );
}
