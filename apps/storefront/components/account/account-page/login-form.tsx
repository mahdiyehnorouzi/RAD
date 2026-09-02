"use client";

import { FormEvent, useRef, useState } from "react";
import { useCommerce } from "@/components/commerce/commerce-provider";
import { Button } from "@/components/ui/button-link";
import { Eyebrow, PageSection } from "@/components/ui/section";
import { useLocale } from "@/components/i18n";
import { usePasswordVisibility } from "@/hooks/use-password-visibility";

export function LoginForm() {
  const { login } = useCommerce();
  const { t } = useLocale();
  const password = usePasswordVisibility();
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const fieldClass =
    "mb-4 min-h-12 w-full border-0 border-b border-rad-line bg-transparent px-0 py-2 outline-none focus:border-rad-clay";

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const value = String(data.get("password") ?? "");
    if (!name || !/^\S+@\S+\.\S+$/.test(email) || value.length < 8) {
      setError(t("loginError"));
      nameRef.current?.focus();
      return;
    }
    try {
      setError("");
      await login({ name, email, password: value });
    } catch {
      setError(t("loginError"));
      nameRef.current?.focus();
    }
  };

  return (
    <PageSection className="grid gap-10 md:grid-cols-2">
      <div>
        <Eyebrow>{t("accountEyebrow")}</Eyebrow>
        <h1 className="m-0 text-h2 font-normal">{t("loginTitle")}</h1>
        <p className="mt-3 text-prose">{t("loginBody")}</p>
        <small className="mt-4 block text-rad-muted">{t("localAccountNote")}</small>
      </div>
      <form className="grid" onSubmit={handleLogin} noValidate>
        {error ? (
          <p className="text-rad-clay" role="alert">
            {error}
          </p>
        ) : null}
        <label htmlFor="login-name">{t("nameLabel")}</label>
        <input
          ref={nameRef}
          className={fieldClass}
          id="login-name"
          name="name"
          autoComplete="name"
          required
        />
        <label htmlFor="login-email">{t("emailLabel")}</label>
        <input
          className={fieldClass}
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        <label htmlFor="login-password">{t("passwordLabel")}</label>
        <div className="mb-2 grid grid-cols-[1fr_auto] items-center border-b border-rad-line">
          <input
            id="login-password"
            name="password"
            type={password.inputType}
            autoComplete="current-password"
            minLength={8}
            required
            className="min-h-12 border-0 bg-transparent outline-none"
          />
          <button
            type="button"
            className="border-0 bg-transparent"
            onClick={password.toggle}
            aria-label={password.visible ? t("hidePassword") : t("showPassword")}
          >
            {password.visible ? "◉" : "◎"}
          </button>
        </div>
        <small className="mb-6 text-rad-muted">{t("passwordHelp")}</small>
        <Button type="submit">{t("login")}</Button>
      </form>
    </PageSection>
  );
}
