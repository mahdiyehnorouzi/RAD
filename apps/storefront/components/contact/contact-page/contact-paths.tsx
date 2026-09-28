"use client";

import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpLeft,
  ArrowUpRight,
  MessageCircle,
  Package,
  PenLine,
} from "lucide-react";
import { useLocale } from "@/components/i18n";
import { RAD_INSTAGRAM, contactPageCopy } from "../const";

/**
 * Each starting point opens its own channel: ideas go to Direct (photos
 * and sketches travel best there), order questions go to the order page
 * where help is filed beside the order, anything else goes to the form.
 */
export function ContactPaths({ onChooseForm }: { onChooseForm: () => void }) {
  const { locale, href } = useLocale();
  const c = contactPageCopy[locale];
  const rtl = locale === "fa";
  const External = rtl ? ArrowUpLeft : ArrowUpRight;
  const Forward = rtl ? ArrowLeft : ArrowRight;

  return (
    <ul className="contact-paths-list">
      <li>
        <a
          className="contact-path is-idea"
          href={RAD_INSTAGRAM.directUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="contact-path-mark" aria-hidden="true">
            <MessageCircle size={20} strokeWidth={1.6} />
          </span>
          <span className="contact-path-copy">
            <strong>{c.ideaTitle}</strong>
            <span>{c.ideaBody}</span>
          </span>
          <span className="contact-path-channel">
            <span>
              {c.ideaChannel}
              <span className="contact-sr"> {c.newTab}</span>
            </span>
            <External size={17} strokeWidth={1.6} aria-hidden="true" />
          </span>
        </a>
      </li>
      <li>
        <Link className="contact-path is-order" href={href("/orders")}>
          <span className="contact-path-mark" aria-hidden="true">
            <Package size={20} strokeWidth={1.6} />
          </span>
          <span className="contact-path-copy">
            <strong>{c.orderTitle}</strong>
            <span>{c.orderBody}</span>
          </span>
          <span className="contact-path-channel">
            <span>{c.orderChannel}</span>
            <Forward size={17} strokeWidth={1.6} aria-hidden="true" />
          </span>
        </Link>
      </li>
      <li>
        <a className="contact-path is-other" href="#message" onClick={onChooseForm}>
          <span className="contact-path-mark" aria-hidden="true">
            <PenLine size={20} strokeWidth={1.6} />
          </span>
          <span className="contact-path-copy">
            <strong>{c.otherTitle}</strong>
            <span>{c.otherBody}</span>
          </span>
          <span className="contact-path-channel">
            <span>{c.otherChannel}</span>
            <ArrowDown size={17} strokeWidth={1.6} aria-hidden="true" />
          </span>
        </a>
      </li>
    </ul>
  );
}
