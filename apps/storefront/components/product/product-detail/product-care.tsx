"use client";
import { Sprout } from "lucide-react";
import type { Locale } from "@rad/types";
import { useLocale } from "@/components/i18n";
import type { WorkTexture } from "@/lib/catalog/material-texture";
import { CARE_CUES, CARE_FALLBACK, pdpCopy } from "./const";
import { PdpSection } from "./pdp-section";
import { WorkStroke } from "./work-stroke";

/** Each sentence of the work's care text becomes one titled step. */
function careSteps(text: string, locale: Locale) {
  return text
    .split(/[.؛;](?=\s|$)/)
    .map((step) => step.trim())
    .filter(Boolean)
    .map((step) => {
      const cue =
        CARE_CUES.find((item) => item.pattern.test(step)) ?? CARE_FALLBACK;
      return {
        step: `${step.charAt(0).toUpperCase()}${step.slice(1)}.`,
        title: cue.title[locale],
        icon: cue.icon,
      };
    });
}

export function ProductCare({
  text,
  glazed,
  textures,
  index,
}: {
  text?: string;
  /** Glazed works close with a note on the variation a hand-laid glaze leaves. */
  glazed: boolean;
  textures: WorkTexture[];
  index: number;
}) {
  const { locale } = useLocale();
  const c = pdpCopy[locale];
  const steps = text ? careSteps(text, locale) : [];
  if (!steps.length) return null;

  return (
    <PdpSection
      id="pdp-care-title"
      title={c.careTitle}
      lede={c.careLede}
      mark={<WorkStroke textures={textures} index={index} />}
      className="pdp-care"
    >
      <ul>
        {steps.map(({ step, title, icon: Icon }) => (
          <li key={step}>
            <span>
              <strong>{title}</strong>
              {step}
            </span>
            <Icon aria-hidden="true" />
          </li>
        ))}
      </ul>
      {glazed ? (
        <p className="pdp-care-note">
          <Sprout aria-hidden="true" />
          <span>{c.glazeNote}</span>
        </p>
      ) : null}
    </PdpSection>
  );
}
