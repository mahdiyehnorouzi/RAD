"use client";

import { Check } from "lucide-react";
import { useLocale } from "@/components/i18n";
import { designerCopy, FORM_OPTIONS, UNSURE_FORM } from "./const";
import type { Designer } from "./hooks";

export function FormStep({ designer }: { designer: Designer }) {
  const { locale } = useLocale();
  const c = designerCopy[locale];

  return (
    <div className="designer-step form-step">
      <header className="designer-step-head">
        <h3 id="form-step-title">{c.formTitle}</h3>
        <p>{c.formHelp}</p>
      </header>
      <div className="designer-checks" role="group" aria-labelledby="form-step-title">
        {FORM_OPTIONS.map((option) => {
          const checked = designer.forms.includes(option.id);
          return (
            <label
              key={option.id}
              className={`designer-check${checked ? " is-checked" : ""}${
                option.id === UNSURE_FORM ? " is-open-idea" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => designer.toggleForm(option.id)}
              />
              <span className="designer-check-box" aria-hidden="true">
                {checked ? <Check size={14} strokeWidth={2} /> : null}
              </span>
              <span>{option.label[locale]}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
