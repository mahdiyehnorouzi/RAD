"use client";
import Link from "next/link";
import Image from "next/image";
import { Mail } from "lucide-react";
import { useLocale } from "@/components/i18n";
import { InstagramIcon, RAD_EMAIL, RAD_INSTAGRAM } from "@/components/contact";
import { FooterGroup } from "./footer-group";
import "./footer.css";

const ENAMAD_CODE = "XTLOzQumBePuJVPKshxY8itu311ulCAa";
const ENAMAD_ID = "7634715";
const ENAMAD_HREF = `https://trustseal.enamad.ir/?id=${ENAMAD_ID}&Code=${ENAMAD_CODE}`;
const ENAMAD_SRC = `https://trustseal.enamad.ir/logo.aspx?id=${ENAMAD_ID}&Code=${ENAMAD_CODE}`;

export function Footer() {
  const { t, href } = useLocale();
  const page = (path: string, label: string) => (
    <Link href={href(path)}>{label}</Link>
  );
  const group = (title: string) => ({ title, moreLabel: t("footerMore", { group: title }) });

  return (
    <footer className="footer">
      <div className="footer-brand">
        <Link href={href("/")} className="footer-logo" aria-label={t("home")}>
          <Image src="/rad-logo.png" alt="" width={1254} height={1254} sizes="8rem" />
        </Link>
        <p>{t("footerTagline")}</p>
      </div>

      <div className="footer-groups">
        <FooterGroup
          {...group(t("footerRad"))}
          links={[
            page("/about", t("footerStory")),
            page("/now", t("footerNow")),
            page("/passport", t("footerPassport")),
          ]}
          more={[page("/differences", t("museumTitle")), page("/account", t("profile"))]}
        />
        <FooterGroup
          {...group(t("footerShop"))}
          links={[
            page("/products", t("footerUnique")),
            page("/studio", t("footerCustom")),
            page("/archive", t("footerArchive")),
          ]}
          more={[page("/shape", t("footerShape"))]}
        />
        <FooterGroup
          {...group(t("footerConnect"))}
          links={[
            page("/contact", t("footerContact")),
            <a
              key="instagram"
              className="footer-icon-link"
              href={RAD_INSTAGRAM.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <InstagramIcon size={16} />
              <bdi dir="ltr">@{RAD_INSTAGRAM.handle}</bdi>
            </a>,
            RAD_EMAIL ? (
              <a key="email" className="footer-icon-link" href={`mailto:${RAD_EMAIL}`}>
                <Mail size={16} strokeWidth={1.6} aria-hidden="true" />
                <bdi dir="ltr">{RAD_EMAIL}</bdi>
              </a>
            ) : (
              <span key="email" className="footer-icon-link is-pending">
                <Mail size={16} strokeWidth={1.6} aria-hidden="true" />
                {t("footerEmail")} — {t("footerEmailSoon")}
              </span>
            ),
          ]}
          more={[page("/help", t("footerHelp"))]}
        />
      </div>

      <div className="footer-bottom">
        <small>{t("footerCopyright")}</small>
        <nav className="footer-legal" aria-label={t("footerLegal")}>
          <Link href={href("/help/terms")}>{t("footerTerms")}</Link>
          <Link href={href("/help/privacy")}>{t("footerPrivacy")}</Link>
        </nav>
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
      </div>
    </footer>
  );
}
