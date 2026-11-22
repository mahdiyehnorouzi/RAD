"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLocale } from "@/components/i18n";
import "./button-link.css";

export function ButtonLink({
  href,
  children,
  light = false,
  outline = false,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  light?: boolean;
  outline?: boolean;
  className?: string;
}) {
  const { href: localizedHref, locale } = useLocale();
  const ArrowIcon = locale === "fa" ? ArrowLeft : ArrowRight;
  return (
    <Link
      className={`button ${light ? "light" : ""} ${outline ? "outline" : ""} ${className}`}
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
  disabled = false,
  className = "",
  ...props
}: {
  children: ReactNode;
  light?: boolean;
  outline?: boolean;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">) {
  return (
    <button
      {...props}
      type={type}
      className={`button${light ? " light" : ""}${outline ? " outline" : ""}${className ? ` ${className}` : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
