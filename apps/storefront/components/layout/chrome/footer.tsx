"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale } from "@/components/i18n";

export function Footer() {
  const { t, href } = useLocale();
  return (
    <footer className="grid grid-cols-1 gap-12 bg-rad-clay px-page pb-8 pt-12 text-rad-paper md:grid-cols-[minmax(180px,0.8fr)_minmax(300px,1.2fr)] md:gap-x-24">
      <div className="grid grid-cols-[120px_1fr] items-center gap-6">
        <Link
          href={href("/")}
          className="block h-[120px] w-[120px]"
          aria-label={t("home")}
        >
          <span className="block h-full w-full" aria-hidden="true">
            <Image
              src="/rad-logo.png"
              alt=""
              width={1254}
              height={1254}
              className="h-full w-full object-contain"
            />
          </span>
        </Link>
        <p className="m-0">{t("footerTagline")}</p>
      </div>
      <div className="grid grid-cols-2 gap-8">
        <section className="grid gap-2.5">
          <b className="text-sm font-medium text-rad-sand">
            {t("footerStudio")}
          </b>
          <Link href={href("/products")}>{t("footerUnique")}</Link>
          <Link href={href("/studio")}>{t("footerCustom")}</Link>
          <Link href={href("/making")}>{t("makingNav")}</Link>
          <Link href={href("/workshop")}>{t("workshopTitle")}</Link>
          <Link href={href("/differences")}>{t("museumTitle")}</Link>
        </section>
        <section className="grid gap-2.5">
          <b className="text-sm font-medium text-rad-sand">{t("footerRad")}</b>
          <Link href={href("/#story")}>{t("footerStory")}</Link>
          <Link href={href("/account")}>{t("profile")}</Link>
        </section>
      </div>
      <small>{t("footerCopyright")}</small>
      <div
        className="flex flex-wrap items-center justify-end gap-4"
        aria-hidden="true"
      >
        <span>1 / 1</span>
        <span>{t("tehranYear")}</span>
      </div>
    </footer>
  );
}
