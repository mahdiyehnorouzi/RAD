"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLocale } from "@/components/i18n";

const variants = {
  solid:
    "min-h-[50px] rounded-control bg-rad-primary px-6 text-white hover:bg-rad-clay",
  outline:
    "min-h-0 rounded-none border-0 border-b border-current bg-transparent px-0 py-[0.45rem] text-rad-ink hover:border-rad-clay hover:text-rad-clay",
  light:
    "min-h-[50px] rounded-control bg-rad-paper px-6 text-rad-ink hover:bg-rad-canvas",
  danger:
    "min-h-[50px] rounded-control bg-rad-clay px-6 text-white hover:bg-rad-ink",
} as const;

export function ButtonLink({
  href,
  children,
  variant = "solid",
  light = false,
  outline = false,
}: {
  href: string;
  children: React.ReactNode;
  variant?: keyof typeof variants;
  light?: boolean;
  outline?: boolean;
}) {
  const { href: localizedHref, locale } = useLocale();
  const ArrowIcon = locale === "fa" ? ArrowLeft : ArrowRight;
  const resolved = outline ? "outline" : light ? "light" : variant;
  return (
    <Link
      className={`inline-flex items-center justify-center gap-2 text-button font-medium transition-colors focus-visible:outline-none focus-visible:shadow-[inset_0_-2px_0_#8a4938] ${variants[resolved]}`}
      href={localizedHref(href)}
    >
      <span>{children}</span>
      <ArrowIcon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
    </Link>
  );
}

export function Button({
  children,
  variant = "solid",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 text-button font-medium transition-colors focus-visible:outline-none focus-visible:shadow-[inset_0_-2px_0_#8a4938] disabled:cursor-not-allowed disabled:opacity-45 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
