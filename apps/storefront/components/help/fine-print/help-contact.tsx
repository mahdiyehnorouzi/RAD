"use client";
import "./fine-print.css";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLocale } from "@/components/i18n";
import { helpCopy } from "../const";

/** Where every guide ends: a person to ask when the text wasn't enough. */
export function HelpContact() {
  const { locale, href } = useLocale();
  const c = helpCopy[locale];
  const Forward = locale === "fa" ? ArrowLeft : ArrowRight;

  return (
    <aside className="help-contact" aria-labelledby="help-contact-title">
      <h2 id="help-contact-title">{c.contactTitle}</h2>
      <p>{c.contactBody}</p>
      <Link className="help-contact-action" href={href("/contact#message")}>
        <span>{c.contactAction}</span>
        <Forward size={17} strokeWidth={1.6} aria-hidden="true" />
      </Link>
    </aside>
  );
}
