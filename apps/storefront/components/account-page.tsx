"use client";

import { FormEvent, useRef, useState } from "react";
import { Heart, PackageSearch } from "lucide-react";
import { useCommerce } from "@/components/commerce/commerce-provider";
import { Button, ButtonLink } from "@/components/ui/button-link";
import { Eyebrow, PageSection } from "@/components/ui/section";
import { useLocale } from "@/components/i18n";
import { usePasswordVisibility } from "@/hooks/use-password-visibility";

function LoginForm() {
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
        <small className="mt-4 block text-rad-muted">
          {t("localAccountNote")}
        </small>
      </div>
      <form className="grid" onSubmit={handleLogin} noValidate>
        {error && (
          <p className="text-rad-clay" role="alert">
            {error}
          </p>
        )}
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
            aria-label={
              password.visible ? t("hidePassword") : t("showPassword")
            }
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

function ProfileView() {
  const { user, logout, favorites, orders } = useCommerce();
  const { t, number } = useLocale();
  if (!user) return null;
  return (
    <PageSection>
      <header className="mb-10 flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <span
            className="grid h-16 w-16 place-items-center rounded-full bg-rad-moss text-2xl text-rad-paper"
            aria-hidden="true"
          >
            {user.name.trim().charAt(0)}
          </span>
          <div>
            <Eyebrow>{t("profileEyebrow")}</Eyebrow>
            <h1 className="m-0 text-h2 font-normal">
              {t("hello")} {user.name}
            </h1>
            <p className="m-0 text-rad-muted">{user.email}</p>
          </div>
        </div>
        <Button type="button" variant="outline" onClick={logout}>
          {t("logout")}
        </Button>
      </header>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="border border-rad-line bg-rad-paper p-8">
          <Heart aria-hidden="true" />
          <Eyebrow className="mt-4">{t("favoriteEyebrow")}</Eyebrow>
          <h2 className="m-0 text-h3 font-normal">
            {number(favorites.length)} {t("savedWorks")}
          </h2>
          <p className="my-4 text-prose">{t("favoriteProfileBody")}</p>
          <ButtonLink href="/favorites">{t("viewFavorites")}</ButtonLink>
        </section>
        <section className="border border-rad-line bg-rad-paper p-8">
          <PackageSearch aria-hidden="true" />
          <Eyebrow className="mt-4">{t("makingEyebrow")}</Eyebrow>
          <h2 className="m-0 text-h3 font-normal">{t("makingTitle")}</h2>
          <p className="my-4 text-prose">{t("makingBody")}</p>
          <ButtonLink href="/making">{t("makingNav")}</ButtonLink>
        </section>
        <section className="border border-rad-line bg-rad-paper p-8">
          <PackageSearch aria-hidden="true" />
          <Eyebrow className="mt-4">{t("ordersEyebrow")}</Eyebrow>
          <h2 className="m-0 text-h3 font-normal">
            {number(orders.length)} {t("orders")}
          </h2>
          <p className="my-4 text-prose">{t("noOrdersBody")}</p>
          <ButtonLink href="/orders">{t("orders")}</ButtonLink>
        </section>
      </div>
    </PageSection>
  );
}

export function AccountPage() {
  const { user } = useCommerce();
  return user ? <ProfileView /> : <LoginForm />;
}
