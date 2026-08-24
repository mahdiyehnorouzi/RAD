"use client";
import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { useCommerce } from "./commerce";
import { useLocale } from "./i18n";
import { PwaPanel } from "./pwa";
import { Heart, PackageSearch } from "lucide-react";
export function AccountPage() {
  const { user, login, logout, favorites, orders } = useCommerce();
  const { locale, t, href, number } = useLocale();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const pageTitle = locale === "fa" ? "حساب کاربری | رَد" : "Account | RAD";
  const handleLogin = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); const name = String(data.get("name") ?? "").trim(); const email = String(data.get("email") ?? "").trim(); const password = String(data.get("password") ?? ""); if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) { setError(t("loginError")); nameRef.current?.focus(); return; } setError(""); login({ name, email }); };
  if (!user) return <><title>{pageTitle}</title><section className="account-page section"><div className="auth-copy"><span className="eyebrow">{t("accountEyebrow")}</span><h1>{t("loginTitle")}</h1><p>{t("loginBody")}</p><small>{t("localAccountNote")}</small></div><form className="auth-form" onSubmit={handleLogin} noValidate>{error && <p className="form-error" role="alert">{error}</p>}<label htmlFor="login-name">{t("nameLabel")}</label><input ref={nameRef} id="login-name" name="name" autoComplete="name" required /><label htmlFor="login-email">{t("emailLabel")}</label><input id="login-email" name="email" type="email" autoComplete="email" required /><label htmlFor="login-password">{t("passwordLabel")}</label><div className="password-field"><input id="login-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" minLength={8} required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? t("hidePassword") : t("showPassword")}>{showPassword ? "◉" : "◎"}</button></div><small>{t("passwordHelp")}</small><button className="button" type="submit">{t("login")}</button></form></section></>;
  return <><title>{pageTitle}</title><section className="profile-page section"><header className="profile-hero"><div className="profile-identity"><span className="profile-avatar" aria-hidden="true">{user.name.trim().charAt(0)}</span><div><span className="eyebrow">{t("profileEyebrow")}</span><h1>{t("hello")} {user.name}</h1><p>{user.email}</p></div></div><button type="button" className="button outline" onClick={logout}>{t("logout")}</button></header><div className="profile-grid"><section className="profile-panel profile-feature"><Heart aria-hidden="true" /><span className="eyebrow">{t("favoriteEyebrow")}</span><h2>{number(favorites.length)} {t("savedWorks")}</h2><p>{t("favoriteProfileBody")}</p><Link className="button" href={href("/favorites")}>{t("viewFavorites")}</Link></section><section className="profile-panel profile-feature"><PackageSearch aria-hidden="true" /><span className="eyebrow">{t("ordersEyebrow")}</span><h2>{number(orders.length)} {t("orders")}</h2><p>{t("noOrdersBody")}</p><Link className="button" href={href("/orders")}>{t("orders")}</Link></section><PwaPanel /></div></section></>;
}
