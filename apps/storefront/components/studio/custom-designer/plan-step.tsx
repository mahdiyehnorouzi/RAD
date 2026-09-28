"use client";

import { useLocale } from "@/components/i18n";
import {
  BUDGET_OPTIONS,
  DATED_TIMELINE,
  TIMELINE_OPTIONS,
  designerCopy,
} from "./const";
import type { Designer } from "./hooks";

function RadioList({
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
    <div className="designer-radios">
      {options.map((option) => (
        <label
          key={option.id}
          className={`designer-radio${value === option.id ? " is-checked" : ""}`}
        >
          <input
            type="radio"
            name={name}
            value={option.id}
            checked={value === option.id}
            onChange={() => onChange(option.id)}
          />
          <span className="designer-radio-dot" aria-hidden="true" />
          <span>{option.label[locale]}</span>
        </label>
      ))}
    </div>
  );
}

export function PlanStep({ designer }: { designer: Designer }) {
  const { locale } = useLocale();
  const c = designerCopy[locale];

  return (
    <div className="designer-step plan-step">
      <header className="designer-step-head">
        <h3>{c.planTitle}</h3>
      </header>

      <fieldset className="details-field">
        <legend>{c.budgetLabel}</legend>
        <small className="details-help">{c.budgetHelp}</small>
        <RadioList
          name="order-budget"
          options={BUDGET_OPTIONS}
          value={designer.budget}
          onChange={designer.setBudget}
        />
      </fieldset>

      <fieldset className="details-field">
        <legend>{c.timelineLabel}</legend>
        <RadioList
          name="order-timeline"
          options={TIMELINE_OPTIONS}
          value={designer.timeline}
          onChange={designer.chooseTimeline}
        />
        {designer.timeline === DATED_TIMELINE ? (
          <>
            <label className="details-exact" htmlFor="order-need-by">
              {c.dateLabel}
            </label>
            <input
              id="order-need-by"
              className="details-input"
              value={designer.needBy}
              onChange={(event) => designer.setNeedBy(event.target.value)}
              placeholder={c.datePlaceholder}
              autoFocus
            />
          </>
        ) : null}
      </fieldset>
    </div>
  );
}
