"use client";

import Link from "next/link";
import { useLocale } from "@/components/i18n";
import { HELP_JOURNEY, helpCopy, policyPath } from "../const";

/** One purchase from choosing to delivery, with the rule that matters at each stop. */
export function HelpJourney() {
  const { locale, href, number } = useLocale();
  const c = helpCopy[locale];

  return (
    <section className="help-journey" aria-labelledby="help-journey-title">
      <h2 id="help-journey-title">{c.journeyTitle}</h2>
      <ol>
        {HELP_JOURNEY.map((step, index) => (
          <li key={step.id}>
            <span className="help-journey-index" aria-hidden="true">
              {locale === "fa"
                ? number(index + 1)
                : String(index + 1).padStart(2, "0")}
            </span>
            <strong>{step.title[locale]}</strong>
            <p>{step.fact[locale]}</p>
            <Link href={href(policyPath(step.slug, step.section))}>
              {c.readMore}
              <span className="help-sr">: {step.title[locale]}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
