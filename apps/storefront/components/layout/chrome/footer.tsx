"use client";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "@/components/i18n";
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
          <Link href={href("/making")}>{t("makingNav")}</Link>
        </section>
        <section>
          <b>{t("footerRad")}</b>
          <Link href={href("/#story")}>{t("footerStory")}</Link>
          <Link href={href("/differences")}>{t("museumTitle")}</Link>
          <Link href={href("/account")}>{t("profile")}</Link>
        </section>
      </div>
      <div className="footer-bottom">
        <a
          className="footer-enamad"
          href={ENAMAD_HREF}
          target="_blank"
          rel="noopener"
          referrerPolicy="origin"
        >
          <img
            referrerPolicy="origin"
            src={ENAMAD_SRC}
            alt={t("enamad")}
            width={125}
            height={136}
            style={{ cursor: "pointer" }}
            {...{ code: ENAMAD_CODE }}
            onError={(event) => {
              const image = event.currentTarget;
              if (image.dataset.fallback === "1") return;
              image.dataset.fallback = "1";
              image.src = "/enamad.png";
            }}
          />
        </a>
        <small>{t("footerCopyright")}</small>
        <div className="footer-signature" aria-hidden="true">
          <span>1 / 1</span>
          <span>{locale === "fa" ? "تهران — ۱۴۰۵" : "TEHRAN — 2026"}</span>
        </div>
      </div>
    </footer>
  );
}
