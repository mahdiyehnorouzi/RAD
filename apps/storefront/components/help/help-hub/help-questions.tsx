"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import type { HelpQuestion } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { helpCopy, policyDocument, policyPath } from "../const";

export function HelpQuestions({ questions }: { questions: HelpQuestion[] }) {
  const { locale, href } = useLocale();
  const c = helpCopy[locale];

  if (!questions.length) return null;

  return (
    <section className="help-questions" aria-labelledby="help-questions-title">
      <h2 id="help-questions-title">{c.questionsTitle}</h2>
      <div className="help-question-list">
        {questions.map((item) => {
          const doc = item.more ? policyDocument(item.more.slug) : undefined;
          return (
            <details key={item.id} className="help-question">
              <summary>
                <span>{item.question[locale]}</span>
                <Plus size={18} strokeWidth={1.6} aria-hidden="true" />
              </summary>
              <div className="help-answer">
                <p>{item.answer[locale]}</p>
                {item.more && doc ? (
                  <Link
                    href={href(policyPath(item.more.slug, item.more.section))}
                  >
                    {c.readMore}: {doc.title[locale]}
                  </Link>
                ) : null}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
