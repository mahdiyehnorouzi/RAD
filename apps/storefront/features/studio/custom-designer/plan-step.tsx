"use client";

import { useLocale } from "@/components/i18n";
import { StudioIcon } from "../studio-icon";
import {
  BUDGET_OPTIONS,
  DATED_TIMELINE,
  TIMELINE_OPTIONS,
  designerCopy,
} from "./const";
import type { Designer } from "./hooks";
import styles from "./plan-step.module.css";
import shell from "./custom-designer.module.css";

function RadioRows({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: Array<{ id: string; label: { fa: string; en: string } }>;
  value: string;
  onChange: (id: string) => void;
}) {
  const { locale } = useLocale();
  return (
    <div className={styles.planRows}>
      {options.map((option) => (
        <label
          key={option.id}
          className={`${shell.cdChoice} ${styles.planRow}${value === option.id ? ` ${styles.checked} ${shell.checked}` : ""}`}
        >
          <input
            type="radio"
            name={name}
            value={option.id}
            checked={value === option.id}
            onChange={() => onChange(option.id)}
          />
          <span>{option.label[locale]}</span>
          <span className={shell.cdRadio} aria-hidden="true" />
        </label>
      ))}
    </div>
  );
}

export function PlanStep({ designer }: { designer: Designer }) {
  const { locale } = useLocale();
  const c = designerCopy[locale];

  return (
    <div className={shell.cdStep}>
      <header className={shell.cdStepHead}>
        <h3>{c.planTitle}</h3>
        <p>{c.planHelp}</p>
      </header>

      <fieldset className={shell.cdField}>
        <legend>{c.budgetLabel}</legend>
        <RadioRows
          name="order-budget"
          options={BUDGET_OPTIONS}
          value={designer.budget}
          onChange={designer.setBudget}
        />
      </fieldset>

      <fieldset className={shell.cdField}>
        <legend>{c.timelineLabel}</legend>
        <RadioRows
          name="order-timeline"
          options={TIMELINE_OPTIONS}
          value={designer.timeline}
          onChange={designer.chooseTimeline}
        />
        {designer.timeline === DATED_TIMELINE ? (
          <>
            <label className={shell.cdSublabel} htmlFor="order-need-by">
              {c.dateLabel}
            </label>
            <span className={`${shell.cdBox} ${shell.cdIconInput}`}>
              <StudioIcon name="calendar" size={20} />
              <input
                id="order-need-by"
                type="date"
                value={designer.needBy}
                onChange={(event) => designer.setNeedBy(event.target.value)}
                placeholder={c.datePlaceholder}
                autoFocus
              />
            </span>
          </>
        ) : null}
      </fieldset>
    </div>
  );
}
