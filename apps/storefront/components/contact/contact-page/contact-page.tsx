"use client";
import "./contact-page.css";

import { useEffect, useState } from "react";
import { CONTACT_TOPICS, type ContactTopic } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { MessageForm } from "../channels";
import { contactPageCopy } from "../const";
import { ContactDirect } from "./contact-direct";
import { ContactHero } from "./contact-hero";
import { ContactPaths } from "./contact-paths";
import { ContactTip } from "./contact-tip";

function topicFromQuery(): ContactTopic | null {
  const value = new URLSearchParams(window.location.search).get("topic");
  return CONTACT_TOPICS.find((topic) => topic === value) ?? null;
}

export function ContactPage() {
  const { locale } = useLocale();
  const c = contactPageCopy[locale];
  const [topic, setTopic] = useState<ContactTopic>();

  useEffect(() => {
    const requested = topicFromQuery();
    if (requested) setTopic(requested);
  }, []);

  return (
    <div className="contact-page">
      <ContactHero />

      <section className="contact-paths" aria-labelledby="contact-paths-title">
        <h2 id="contact-paths-title" className="contact-heading">
          {c.pathsTitle}
          <svg
            className="contact-thread contact-heading-squiggle"
            viewBox="0 0 160 16"
            aria-hidden="true"
            focusable="false"
          >
            <path pathLength={1} d="M2 6C24 3 44 4 66 9C90 14 116 14 136 9C146 6 152 4 158 3" />
          </svg>
        </h2>
        <ContactPaths onChooseTopic={setTopic} />
      </section>

      <div className="contact-talk">
        <section className="contact-form-block" id="message" aria-labelledby="contact-form-title">
          <h2 id="contact-form-title" className="contact-form-title">
            <svg className="contact-form-mark" viewBox="0 0 16 30" aria-hidden="true" focusable="false">
              <path d="M11.2 2C11.4 7.5 9.4 14 7.4 19.6" />
              <circle cx="6.2" cy="26" r="1.9" />
            </svg>
            <span>{c.formTitle}</span>
          </h2>
          <p className="contact-form-lede">{c.formLede}</p>
          <MessageForm source="contact" variant="page" defaultTopic={topic} />
        </section>
        <ContactDirect />
      </div>

      <ContactTip />
    </div>
  );
}
