"use client";

import Image from "next/image";
import { useLocale } from "@/components/i18n";
import { designerCopy, FORM_OPTIONS, USE_OPTIONS } from "./const";
import type { Designer } from "./hooks";
import styles from "./form-step.module.css";
import shell from "./custom-designer.module.css";

export function FormStep({ designer }: { designer: Designer }) {
  const { locale } = useLocale();
  const c = designerCopy[locale];

  return (
    <div className={shell.cdStep}>
      <header className={shell.cdStepHead}>
        <h3 id="form-step-title">{c.formTitle}</h3>
        <p>{c.formHelp}</p>
      </header>

      <div
        className={styles.formCards}
        role="radiogroup"
        aria-labelledby="form-step-title"
      >
        {FORM_OPTIONS.map((option, index) => {
          const checked = designer.form === option.id;
          return (
            <label
              key={option.id}
              className={`${shell.cdChoice} ${styles.formCard}${index < 2 ? ` ${styles.wide}` : ""}${checked ? ` ${styles.checked} ${shell.checked}` : ""}`}
            >
              <input
                type="radio"
                name="order-form"
                value={option.id}
                checked={checked}
                onChange={() => designer.setForm(option.id)}
              />
              <span className={styles.formCardArt} aria-hidden="true">
                <Image
                  src={option.image}
                  alt=""
                  fill
                  sizes="(max-width: 700px) 45vw, 20rem"
                />
                <span className={`${shell.cdRadio} ${styles.formCardRadio}`} />
              </span>
              <span className={styles.formCardFoot}>
                {option.label[locale]}
              </span>
            </label>
          );
        })}
      </div>

      <fieldset className={shell.cdField}>
        <legend>{c.useLabel}</legend>
        <div className={styles.useChips}>
          {USE_OPTIONS.map((option) => {
            const checked = designer.uses.includes(option.id);
            return (
              <label
                key={option.id}
                className={`${shell.cdChoice} ${styles.useChip}${checked ? ` ${styles.checked}` : ""}`}
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
