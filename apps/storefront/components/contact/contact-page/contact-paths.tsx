"use client";

import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpLeft, ArrowUpRight } from "lucide-react";
import type { ContactTopic } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { RAD_INSTAGRAM, contactMedia, contactPageCopy } from "../const";
import type { ContactPathKey } from "../type";

/** Reading order of the cards; the grid fills from the reading start. */
const PATH_ORDER: readonly ContactPathKey[] = ["order", "custom", "other", "collaboration"];

/**
 * Each starting point opens its own channel: order questions go to the
 * orders page, custom ideas go to Direct (photos and sketches travel best
 * there), and anything else drops to the form with its topic picked.
 */
export function ContactPaths({ onChooseTopic }: { onChooseTopic: (topic: ContactTopic) => void }) {
  const { locale, href } = useLocale();
  const c = contactPageCopy[locale];
  const rtl = locale === "fa";
  const External = rtl ? ArrowUpLeft : ArrowUpRight;
  const Forward = rtl ? ArrowLeft : ArrowRight;
  const mask = { "--contact-deckle": `url(${contactMedia.deckle})` } as CSSProperties;

  const body = (key: ContactPathKey, icon: ReactNode, extra?: ReactNode) => {
    const path = c.paths[key];
    return (
      <>
        <span className="contact-path-media" style={mask} aria-hidden="true">
          <Image src={contactMedia.paths[key]} alt="" fill sizes="(min-width: 960px) 16rem, 45vw" />
        </span>
        <span className="contact-path-copy">
          <strong>{path.title}</strong>
          <span>{path.body}</span>
          <span className="contact-sr">
            {" "}
            {path.channel}
            {extra}
          </span>
        </span>
        <span className="contact-path-go" aria-hidden="true">
          {icon}
        </span>
      </>
    );
  };

  return (
    <ul className="contact-paths-grid">
      {PATH_ORDER.map((key, index) => (
        <li key={key} style={{ "--i": index } as CSSProperties}>
          {key === "order" ? (
            <Link className="contact-path" href={href("/orders")}>
              {body(key, <Forward />)}
            </Link>
          ) : key === "custom" ? (
            <a
              className="contact-path"
              href={RAD_INSTAGRAM.directUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {body(key, <External />, ` ${c.newTab}`)}
            </a>
          ) : (
            <a className="contact-path" href="#message" onClick={() => onChooseTopic(key)}>
              {body(key, <ArrowDown />)}
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
