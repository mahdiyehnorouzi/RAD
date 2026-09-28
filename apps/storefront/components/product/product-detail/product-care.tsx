"use client";
import { useLocale } from "@/components/i18n";
import { CARE_CUES, CARE_FALLBACK_ICON, pdpCopy } from "./const";
import { PdpSection } from "./pdp-section";

function careSteps(text: string) {
  return text
    .split(/[.؛;](?=\s|$)/)
    .map((step) => step.trim())
    .filter(Boolean)
    .map((step) => step.charAt(0).toUpperCase() + step.slice(1))
    .map((step) => ({
      step,
      icon:
        CARE_CUES.find((cue) => cue.pattern.test(step))?.icon ??
        CARE_FALLBACK_ICON,
    }));
}

export function ProductCare({ text }: { text?: string }) {
  const { locale } = useLocale();
  const steps = text ? careSteps(text) : [];
  if (!steps.length) return null;

  return (
    <PdpSection
      id="pdp-care-title"
      title={pdpCopy[locale].careTitle}
      className="pdp-care"
    >
      <ul>
        {steps.map(({ step, icon: Icon }) => (
          <li key={step}>
            <Icon aria-hidden="true" />
            <span>{step}</span>
          </li>
        ))}
      </ul>
    </PdpSection>
  );
}
