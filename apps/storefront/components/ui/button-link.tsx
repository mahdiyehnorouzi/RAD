"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLocale } from "@/components/i18n";

export function ButtonLink({
  href,
  children,
  light = false,
  outline = false,
}: {
  href: string;
  children: React.ReactNode;
  light?: boolean;
  outline?: boolean;
}) {
  const { href: localizedHref, locale } = useLocale();
  const ArrowIcon = locale === "fa" ? ArrowLeft : ArrowRight;
  return (
    <Link
      className={`button ${light ? "light" : ""} ${outline ? "outline" : ""}`}
      href={localizedHref(href)}
    >
      <span>{children}</span>
      <ArrowIcon className="button-arrow" aria-hidden="true" />
    </Link>
  );
}

export function Button({
  children,
  type = "button",
  onClick,
  light = false,
  outline = false,
}: {
  children: React.ReactNode;
  type?: "button" | "submit";
  onClick?: () => void;
  light?: boolean;
  outline?: boolean;
}) {
  return (
    <button
      type={type}
      className={`button ${light ? "light" : ""} ${outline ? "outline" : ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
