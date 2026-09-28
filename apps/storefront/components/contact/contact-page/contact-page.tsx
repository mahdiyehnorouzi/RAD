"use client";
import "./contact-page.css";

import Image from "next/image";
import { useEffect, useState } from "react";
import { CONTACT_TOPICS, type ContactTopic } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { MessageForm } from "../channels";
import { contactPageCopy } from "../const";
import { ContactDirect } from "./contact-direct";
import { ContactPaths } from "./contact-paths";

function topicFromQuery(): ContactTopic | null {
  const value = new URLSearchParams(window.location.search).get("topic");
  return CONTACT_TOPICS.find((topic) => topic === value) ?? null;
}

export function ContactPage() {
  const { locale } = useLocale();
  const c = contactPageCopy[locale];
  const [topic, setTopic] = useState<ContactTopic>("other");

  useEffect(() => {
    const requested = topicFromQuery();
    if (requested) setTopic(requested);
  }, []);

  return (
    <div className="contact-page">
      <section className="contact-opening">
        <div className="contact-opening-copy">
          <h1>{c.title}</h1>
          <p className="contact-lede">{c.lede}</p>
          <p className="contact-human">{c.human}</p>
        </div>
        <figure className="contact-photo">
          <div className="contact-photo-frame">
            <Image
              src="/studio-process.jpg"
              alt={c.photoAlt}
              fill
              priority
              sizes="(max-width: 760px) 60vw, 20rem"
            />
          </div>
          <figcaption>{c.photoCaption}</figcaption>
        </figure>
      </section>

      <section className="contact-paths" aria-labelledby="contact-paths-title">
        <h2 id="contact-paths-title">{c.pathsTitle}</h2>
        <ContactPaths onChooseForm={() => setTopic("other")} />
      </section>

      <section className="contact-talk">
        <div className="contact-form-block" id="message">
          <h2>{c.formTitle}</h2>
          <p>{c.formLede}</p>
          <MessageForm source="contact" defaultTopic={topic} />
        </div>
        <ContactDirect />
      </section>
    </div>
  );
}
