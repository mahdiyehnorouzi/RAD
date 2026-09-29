"use client";

import Image from "next/image";
import { useLocale } from "@/components/i18n";
import { designerCopy, FORM_OPTIONS, USE_OPTIONS } from "./const";
import type { Designer } from "./hooks";

export function FormStep({ designer }: { designer: Designer }) {
  const { locale } = useLocale();
  const c = designerCopy[locale];

  return (
    <div className="cd-step form-step">
      <header className="cd-step-head">
        <h3 id="form-step-title">{c.formTitle}</h3>
        <p>{c.formHelp}</p>
      </header>

      <div className="form-cards" role="radiogroup" aria-labelledby="form-step-title">
        {FORM_OPTIONS.map((option, index) => {
          const checked = designer.form === option.id;
          return (
            <label
              key={option.id}
              className={`cd-choice form-card${index < 2 ? " is-wide" : ""}${checked ? " is-checked" : ""}`}
            >
              <input
                type="radio"
                name="order-form"
                value={option.id}
                checked={checked}
                onChange={() => designer.setForm(option.id)}
              />
              <span className="form-card-art" aria-hidden="true">
                <Image
                  src={option.image}
                  alt=""
                  fill
                  sizes="(max-width: 700px) 45vw, 20rem"
                />
                <span className="cd-radio" />
              </span>
              <span className="form-card-foot">{option.label[locale]}</span>
            </label>
          );
        })}
      </div>

      <fieldset className="cd-field">
        <legend>{c.useLabel}</legend>
        <div className="use-chips">
          {USE_OPTIONS.map((option) => {
            const checked = designer.uses.includes(option.id);
            return (
              <label
                key={option.id}
                className={`cd-choice use-chip${checked ? " is-checked" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => designer.toggleUse(option.id)}
                />
                <span>{option.label[locale]}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
