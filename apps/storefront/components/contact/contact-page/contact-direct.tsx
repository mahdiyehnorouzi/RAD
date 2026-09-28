"use client";

import { ArrowUpLeft, ArrowUpRight, Mail } from "lucide-react";
import { useLocale } from "@/components/i18n";
import { InstagramIcon } from "../channels";
import { RAD_EMAIL, RAD_INSTAGRAM, contactPageCopy } from "../const";

export function ContactDirect() {
  const { locale } = useLocale();
  const c = contactPageCopy[locale];
  const External = locale === "fa" ? ArrowUpLeft : ArrowUpRight;

  return (
    <aside className="contact-direct" aria-labelledby="contact-direct-title">
      <h2 id="contact-direct-title">{c.directTitle}</h2>
      <ul>
        <li>
          <span className="contact-direct-mark" aria-hidden="true">
            <InstagramIcon size={19} />
          </span>
          <span className="contact-direct-copy">
            <strong>
              <bdi dir="ltr">@{RAD_INSTAGRAM.handle}</bdi>
            </strong>
            <small>{c.instagramSub}</small>
          </span>
          <a
            className="contact-direct-action"
            href={RAD_INSTAGRAM.directUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${c.open}: ${c.instagramSub} @${RAD_INSTAGRAM.handle} ${c.newTab}`}
          >
            <span>{c.open}</span>
            <External size={16} strokeWidth={1.6} aria-hidden="true" />
          </a>
        </li>
        <li>
          <span className="contact-direct-mark" aria-hidden="true">
            <Mail size={19} strokeWidth={1.6} />
          </span>
          <span className="contact-direct-copy">
            <strong>{c.emailTitle}</strong>
            <small>{c.emailSub}</small>
          </span>
          {RAD_EMAIL ? (
            <a className="contact-direct-action" href={`mailto:${RAD_EMAIL}`}>
              <bdi dir="ltr">{RAD_EMAIL}</bdi>
            </a>
          ) : (
            <span className="contact-direct-pending">{c.emailSoon}</span>
          )}
        </li>
      </ul>
      <div className="contact-tip">
        <h3>{c.tipTitle}</h3>
        <p>{c.tipBody}</p>
      </div>
    </aside>
  );
}
