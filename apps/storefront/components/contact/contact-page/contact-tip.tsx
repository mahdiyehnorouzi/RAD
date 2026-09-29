"use client";

import Image from "next/image";
import { useLocale } from "@/components/i18n";
import { contactMedia, contactPageCopy, contactTears } from "../const";
import { ContactTear } from "./contact-tear";

export function ContactTip() {
  const { locale } = useLocale();
  const c = contactPageCopy[locale];

  return (
    <aside className="contact-tip" aria-labelledby="contact-tip-title">
      <ContactTear shape={contactTears.band} className="contact-tip-tear is-top" />
      <span className="contact-tip-media" aria-hidden="true">
        <Image src={contactMedia.tools} alt="" fill sizes="(min-width: 960px) 76rem, 100vw" />
      </span>
      <div className="contact-tip-copy">
        <h2 id="contact-tip-title">{c.tipTitle}</h2>
        <p>{c.tipBody}</p>
        <svg
          className="contact-thread contact-tip-thread"
          viewBox="0 0 120 12"
          aria-hidden="true"
          focusable="false"
        >
          <path pathLength={1} d="M2 8C20 4 40 9 62 6C82 3 100 7 118 5" />
        </svg>
      </div>
      <ContactTear shape={contactTears.band} className="contact-tip-tear is-bottom" />
    </aside>
  );
}
