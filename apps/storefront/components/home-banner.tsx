"use client";

import { usePathname } from "next/navigation";
import { RadBanner } from "@rad/ui";
import { faCore } from "@rad/i18n/fa";
import { enCore } from "@rad/i18n/en";
import { useLocale } from "./i18n";

export function HomeBanner() {
  const pathname = usePathname();
  const { locale, href } = useLocale();
  if (pathname !== "/") return null;
  const copy = locale === "fa" ? faCore : enCore;
  return <RadBanner message={copy.homeBanner} action={copy.homeBannerAction} href={href("/products")} />;
}
