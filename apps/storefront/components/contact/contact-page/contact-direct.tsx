"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Check, ChevronLeft, ChevronRight, Copy, Mail } from "lucide-react";
import { useLocale } from "@/components/i18n";
import { InstagramIcon } from "../channels";
import { RAD_EMAIL, RAD_INSTAGRAM, contactMedia, contactPageCopy, contactTears } from "../const";
import { ContactTear } from "./contact-tear";

export function ContactDirect() {
  const { locale } = useLocale();
  const c = contactPageCopy[locale];
  const Chevron = locale === "fa" ? ChevronLeft : ChevronRight;
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  const copyEmail = async () => {
    if (!RAD_EMAIL) return;
    window.clearTimeout(resetTimer.current);
    try {
      await navigator.clipboard.writeText(RAD_EMAIL);
      setCopied(true);
      resetTimer.current = window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="contact-direct" aria-labelledby="contact-direct-title">
      <h2 id="contact-direct-title" className="contact-sr">
        {c.directTitle}
      </h2>

      <div className="contact-insta">
        <ContactTear shape={contactTears.card} className="contact-insta-tear is-top" />
        <span className="contact-insta-sprig" aria-hidden="true">
          <Image src={contactMedia.sprig} alt="" width={320} height={345} sizes="7rem" />
        </span>
        <div className="contact-insta-copy">
          <h3>{c.instagramTitle}</h3>
          <p>{c.instagramSub}</p>
        </div>
        <a
          className="contact-insta-handle"
          href={RAD_INSTAGRAM.directUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${c.instagramLabel} @${RAD_INSTAGRAM.handle} ${c.newTab}`}
        >
          <InstagramIcon size={20} />
          <bdi dir="ltr">@{RAD_INSTAGRAM.handle}</bdi>
          <Chevron className="contact-insta-chevron" size={16} strokeWidth={1.8} aria-hidden="true" />
        </a>
        <svg
          className="contact-thread contact-insta-thread"
          viewBox="0 0 200 40"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <path pathLength={1} d="M0 36C40 38 90 36 130 30C160 26 186 18 200 2" />
        </svg>
        <ContactTear shape={contactTears.card} className="contact-insta-tear is-bottom" />
      </div>

      <div className="contact-mail">
        <span className="contact-mail-mark" aria-hidden="true">
          <svg className="contact-mail-wash" viewBox="0 0 120 100" preserveAspectRatio="none" focusable="false">
            <path d="M8 22C20 6 58 2 86 8C108 12 118 30 116 52C114 76 96 94 66 96C38 98 12 90 4 70C-2 54 0 34 8 22Z" />
          </svg>
          <Mail size={30} strokeWidth={1.4} />
        </span>
        <div className="contact-mail-copy">
          <h3>{c.emailTitle}</h3>
          <p>{c.emailSub}</p>
          {RAD_EMAIL ? (
            <span className="contact-mail-address">
              <a href={`mailto:${RAD_EMAIL}`}>
                <bdi dir="ltr">{RAD_EMAIL}</bdi>
              </a>
              <button
                type="button"
                className="contact-mail-copy-button"
                onClick={copyEmail}
                aria-label={copied ? c.copied : c.copyEmail}
              >
                {copied ? (
                  <Check size={16} strokeWidth={1.8} aria-hidden="true" />
                ) : (
                  <Copy size={16} strokeWidth={1.6} aria-hidden="true" />
                )}
              </button>
              <span className="contact-sr" aria-live="polite">
                {copied ? c.copied : ""}
              </span>
            </span>
          ) : (
            <span className="contact-mail-pending">{c.emailSoon}</span>
          )}
        </div>
      </div>
    </section>
  );
}
