"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale } from "@/components/i18n";

export function Footer() {
  const { t, href } = useLocale();
  return (
    <footer className="footer">
      <div className="footer-brand">
        <Link
          href={href("/")}
          className="footer-mark"
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
      <div className="footer-nav">
        <section className="grid gap-2.5">
          <b className="text-sm font-medium text-rad-sand">
            {t("footerStudio")}
          </b>
          <Link href={href("/products")}>{t("footerUnique")}</Link>
          <Link href={href("/studio")}>{t("footerCustom")}</Link>
        </section>
        <section className="grid gap-2.5">
          <b className="text-sm font-medium text-rad-sand">{t("footerRad")}</b>
          <Link href={href("/#story")}>{t("footerStory")}</Link>
          <Link href={href("/account")}>{t("profile")}</Link>
        </section>
      </div>
      <div className="footer-bottom">
        <small>{t("footerCopyright")}</small>
        <div className="footer-meta" aria-hidden="true">
          <span dir="ltr">{t("editionMark")}</span>
          <span>{t("tehranYear")}</span>
        </div>
      </div>
    </footer>
  );
}
