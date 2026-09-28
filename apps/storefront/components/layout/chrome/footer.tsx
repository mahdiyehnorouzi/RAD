"use client";
import Link from "next/link";
import Image from "next/image";
import { Mail } from "lucide-react";
import { useLocale } from "@/components/i18n";
import { InstagramIcon, RAD_EMAIL, RAD_INSTAGRAM } from "@/components/contact";
import "./footer.css";

const ENAMAD_CODE = "XTLOzQumBePuJVPKshxY8itu311ulCAa";
const ENAMAD_ID = "7634715";
const ENAMAD_HREF = `https://trustseal.enamad.ir/?id=${ENAMAD_ID}&Code=${ENAMAD_CODE}`;
const ENAMAD_SRC = `https://trustseal.enamad.ir/logo.aspx?id=${ENAMAD_ID}&Code=${ENAMAD_CODE}`;

export function Footer() {
  const { t, href, locale } = useLocale();
  return (
    <footer className="footer">
      <div>
        <Link href={href("/")} className="footer-logo" aria-label={t("home")}>
          <span className="footer-logo-image" aria-hidden="true">
            <Image src="/rad-logo.png" alt="" width={1254} height={1254} />
          </span>
        </Link>
        <p>{t("footerTagline")}</p>
      </div>
      <div className="footer-links">
        <section>
          <b>{t("footerStudio")}</b>
          <Link href={href("/products")}>{t("footerUnique")}</Link>
          <Link href={href("/studio")}>{t("footerCustom")}</Link>
          <Link href={href("/archive")}>{t("footerArchive")}</Link>
          <Link href={href("/shape")}>{t("footerShape")}</Link>
        </section>
        <section>
          <b>{t("footerRad")}</b>
          <Link href={href("/about")}>{t("footerStory")}</Link>
          <Link href={href("/now")}>{t("footerNow")}</Link>
          <Link href={href("/passport")}>{t("footerPassport")}</Link>
          <Link href={href("/differences")}>{t("museumTitle")}</Link>
          <Link href={href("/account")}>{t("profile")}</Link>
        </section>
        <section className="footer-contact">
          <b>{t("footerContact")}</b>
          <Link href={href("/contact")}>{t("footerContactPage")}</Link>
          <Link href={href("/help")}>{t("footerHelp")}</Link>
          <a
            href={RAD_INSTAGRAM.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <InstagramIcon size={16} />
            <bdi dir="ltr">@{RAD_INSTAGRAM.handle}</bdi>
          </a>
          {RAD_EMAIL ? (
            <a href={`mailto:${RAD_EMAIL}`}>
              <Mail size={16} strokeWidth={1.6} aria-hidden="true" />
              <bdi dir="ltr">{RAD_EMAIL}</bdi>
            </a>
          ) : (
            <span className="footer-contact-pending">
              <Mail size={16} strokeWidth={1.6} aria-hidden="true" />
              {t("footerEmail")} — {t("footerEmailSoon")}
            </span>
          )}
        </section>
      </div>
      <div className="footer-bottom">
        <a
          className="footer-enamad"
          referrerPolicy="origin"
          target="_blank"
          href={ENAMAD_HREF}
        >
          <img
            referrerPolicy="origin"
            src={ENAMAD_SRC}
            alt=""
            style={{ cursor: "pointer" }}
            {...{ code: ENAMAD_CODE }}
          />
        </a>
        <small>{t("footerCopyright")}</small>
        <nav className="footer-legal" aria-label={t("footerLegal")}>
          <Link href={href("/help/terms")}>{t("footerTerms")}</Link>
          <Link href={href("/help/privacy")}>{t("footerPrivacy")}</Link>
        </nav>
        <div className="footer-signature" aria-hidden="true">
          <span>1 / 1</span>
          <span>{locale === "fa" ? "تهران — ۱۴۰۵" : "TEHRAN — 2026"}</span>
        </div>
      </div>
    </footer>
  );
}
