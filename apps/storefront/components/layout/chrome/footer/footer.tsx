"use client";
import Link from "next/link";
import { Mail } from "lucide-react";
import { useLocale } from "@/components/i18n";
import { InstagramIcon, RAD_EMAIL, RAD_INSTAGRAM } from "@/components/contact";
import { ENAMAD_CODE, ENAMAD_HREF, ENAMAD_SRC } from "./const";
import { useFooterReveal } from "./hooks";
import { FooterGroup } from "./footer-group";
import { FooterThread } from "./footer-thread";
import "./footer.css";

export function Footer() {
  const { t, href } = useLocale();
  const signRef = useFooterReveal<HTMLDivElement>();
  const page = (path: string, label: string) => (
    <Link key={path} href={href(path)}>
      {label}
    </Link>
  );

  return (
    <footer className="footer">
      <span className="footer-tear" aria-hidden="true" />

      <div ref={signRef} className="footer-sign">
        <p className="footer-tagline">{t("footerTagline")}</p>
        <FooterThread />
      </div>

      <div className="footer-index">
        <FooterGroup
          title={t("footerShop")}
          links={[
            page("/products", t("footerUnique")),
            page("/studio", t("footerCustom")),
            page("/shape", t("footerShape")),
          ]}
        />
        <FooterGroup
          title={t("footerRad")}
          links={[
            page("/about", t("footerStory")),
            page("/now", t("footerNow")),
            page("/reviews", t("footerReviews")),
            page("/differences", t("museumTitle")),
            page("/account", t("profile")),
          ]}
        />
        <FooterGroup
          title={t("footerConnect")}
          links={[
            page("/contact", t("footerContact")),
            page("/help", t("footerHelp")),
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
        />
      </div>

      <div className="footer-bottom">
        <Link href={href("/")} className="footer-mark" aria-label={t("home")}>
          <span aria-hidden="true" />
        </Link>
        <small className="footer-copyright">{t("footerCopyright")}</small>
        <nav className="footer-legal" aria-label={t("footerLegal")}>
          <Link href={href("/help/terms")}>{t("footerTerms")}</Link>
          <Link href={href("/help/privacy")}>{t("footerPrivacy")}</Link>
        </nav>
        <a
          className="footer-enamad"
          referrerPolicy="origin"
          target="_blank"
          href={ENAMAD_HREF}
          aria-label={t("footerEnamad")}
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
