"use client";
import "./fine-print.css";

import Link from "next/link";
import { ArrowLeft, ArrowRight, MessageCircleMore } from "lucide-react";
import { useLocale } from "@/components/i18n";
import { helpCopy } from "../const";

/**
 * Where every guide ends: a person to ask when the text wasn't enough.
 * `bar` lays it out in one row under a guide; `panel` stacks it in a column.
 */
export function HelpContact({
  variant = "panel",
}: {
  variant?: "panel" | "bar";
}) {
  const { locale, href } = useLocale();
  const c = helpCopy[locale];
  const Forward = locale === "fa" ? ArrowLeft : ArrowRight;

  return (
    <aside
      className={`help-contact is-${variant}`}
      aria-labelledby="help-contact-title"
    >
      {variant === "bar" ? (
        <span className="help-contact-icon">
          <MessageCircleMore size={22} strokeWidth={1.5} aria-hidden="true" />
        </span>
      ) : null}
      <div className="help-contact-copy">
        <h2 id="help-contact-title">{c.contactTitle}</h2>
        <p>{c.contactBody}</p>
      </div>
      <Link className="help-contact-action" href={href("/contact#message")}>
        <span>{c.contactAction}</span>
        <Forward size={17} strokeWidth={1.6} aria-hidden="true" />
      </Link>
    </aside>
  );
}
