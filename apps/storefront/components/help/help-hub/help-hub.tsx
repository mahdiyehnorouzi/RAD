"use client";
import "./help-hub.css";

import type { HelpQuestion } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { helpCopy } from "../const";
import { HelpContact, LegalTexts } from "../fine-print";
import { HelpJourney } from "./help-journey";
import { HelpQuestions } from "./help-questions";
import { HelpTopics } from "./help-topics";

/**
 * RAD's shopping guide: the four plain-language guides, the purchase path,
 * common questions, and the official texts they rest on.
 */
export function HelpHub({ questions }: { questions: HelpQuestion[] }) {
  const { locale } = useLocale();
  const c = helpCopy[locale];

  return (
    <div className="help-hub">
      <header className="help-opening">
        <h1>{c.title}</h1>
        <p className="help-lede">{c.lede}</p>
        <p className="help-why">{c.why}</p>
      </header>

      <section
        className="help-topics-block"
        aria-labelledby="help-topics-title"
      >
        <h2 id="help-topics-title" className="help-sr">
          {c.topicsTitle}
        </h2>
        <HelpTopics />
      </section>

      <HelpJourney />

      <div className="help-closing">
        <HelpQuestions questions={questions} />
        <div className="help-closing-side">
          <HelpContact />
          <LegalTexts />
        </div>
      </div>
    </div>
  );
}
