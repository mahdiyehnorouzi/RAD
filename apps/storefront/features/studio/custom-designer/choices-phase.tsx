"use client";

import { useState, type ReactNode } from "react";
import { Check, Pencil } from "lucide-react";
import { useLocale } from "@/components/i18n";
import type { Designer } from "./hooks";
import { validDimension, validFutureDate } from "./hooks/use-designer";
import {
  BUDGET_OPTIONS,
  DESIGNER_COLORS,
  FORM_OPTIONS,
  SIZE_OPTIONS,
  TIMELINE_OPTIONS,
  colorLabel,
  optionLabel,
} from "./const";
import type { ChoicesSectionId as SectionId } from "./type/choices-section";
import { sectionOrder } from "./type/choices-section";
import styles from "./choices-phase.module.css";

export type { ChoicesSectionId } from "./type/choices-section";

export function ChoicesPhase({
  designer: d,
  hasReference,
  onDone,
  editingFromReview,
  reachedIndex,
  openId,
  onReachedIndexChange,
  onOpenIdChange,
  registerSection,
  scrollToSection,
}: {
  designer: Designer;
  hasReference: boolean;
  onDone: () => void;
  /** True while the visitor arrived here via an "Edit" action from Review:
   * confirming any section returns straight back to Review instead of
   * advancing to the next section, since every section is already answered. */
  editingFromReview: boolean;
  /** Owned by the parent orchestrator so a visitor's exact position in
   * Choices survives navigating away to Idea or Review and back — nothing
   * here is local state that would reset on remount. */
  reachedIndex: number;
  openId: SectionId;
  onReachedIndexChange: (index: number) => void;
  onOpenIdChange: (id: SectionId) => void;
  /** From the parent's `useScrollToSection()` — shared so the scroll math
   * can measure the orchestrator's own sticky header/stepper, which this
   * component doesn't render. */
  registerSection: (id: string) => (el: HTMLElement | null) => void;
  scrollToSection: (id: string) => void;
}) {
  const { locale } = useLocale();
  const fa = locale === "fa";
  const txt = (faText: string, en: string) => (fa ? faText : en);
  const order = sectionOrder(hasReference);
  // Defensive: if the order changed shape (a reference photo was added or
  // removed back in Idea) and the previously open section no longer exists,
  // fall back to the nearest valid one instead of rendering nothing.
  const safeOpenId = order.includes(openId)
    ? openId
    : order[Math.min(reachedIndex, order.length - 1)];
  const [exactOpen, setExactOpen] = useState(false);
  const exact = exactOpen || Boolean(d.length || d.width || d.height);
  const [customColorOpen, setCustomColorOpen] = useState(false);
  const customColor = customColorOpen || Boolean(d.colorNote);

  const validSize = [d.length, d.width, d.height].every(validDimension);
  const validDate = d.timeline !== "date" || validFutureDate(d.needBy);

  function advance(fromId: SectionId) {
    if (editingFromReview) {
      onDone();
      return;
    }
    const idx = order.indexOf(fromId);
    if (idx !== reachedIndex) {
      // Editing an earlier, already-answered section: collapse back in place.
      onOpenIdChange(order[reachedIndex]);
      return;
    }
    if (idx === order.length - 1) {
      onDone();
      return;
    }
    const nextIdx = idx + 1;
    onReachedIndexChange(nextIdx);
    onOpenIdChange(order[nextIdx]);
    scrollToSection(order[nextIdx]);
  }

  const titles: Record<SectionId, string> = {
    category: txt("چی بسازیم؟", "What should we make?"),
    size: txt("چه اندازه‌ای باشه؟", "What size?"),
    color: txt("چه رنگی مد نظرته؟", "Which colors do you have in mind?"),
    similarity: txt(
      "چقدر شبیه عکسی باشه که فرستادی؟",
      "How close to your reference?",
    ),
    budget: txt("حدوداً چقدر می‌خوای هزینه کنی؟", "What budget do you have in mind?"),
    timeline: txt("تا کی بهش نیاز داری؟", "When do you need it?"),
  };

  const summaries: Record<SectionId, string> = {
    category: optionLabel(FORM_OPTIONS, d.form, locale),
    size: [
      optionLabel(SIZE_OPTIONS, d.size, locale),
      [d.length, d.width, d.height].filter(Boolean).join(" × "),
    ]
      .filter(Boolean)
      .join(" — "),
    color: [...d.colors.map((v) => colorLabel(v, locale)), d.colorNote]
      .filter(Boolean)
      .join("، "),
    similarity: "",
    budget: optionLabel(BUDGET_OPTIONS, d.budget, locale),
    timeline:
      d.needBy || optionLabel(TIMELINE_OPTIONS, d.timeline, locale),
  };

  const rows = (
    name: string,
    options: typeof BUDGET_OPTIONS,
    value: string,
    choose: (id: string) => void,
  ) => (
    <div className={styles.rows}>
      {options.map((o) => (
        <label key={o.id} className={styles.radioRow}>
          <input
            type="radio"
            name={name}
            checked={value === o.id}
            onChange={() => choose(o.id)}
          />
          <span>{o.label[locale]}</span>
        </label>
      ))}
    </div>
  );

  const continueButton = (disabled: boolean, id: SectionId) => (
    <button
      type="button"
      className={styles.continueBtn}
      disabled={disabled}
      onClick={() => advance(id)}
    >
      {txt("ادامه", "Continue")}
    </button>
  );

  const content: Record<SectionId, ReactNode> = {
    category: (
      <div className={styles.categoryGrid}>
        {["container", "vase", "serving", "light", "accessory", "open"]
          .map((id) => FORM_OPTIONS.find((o) => o.id === id)!)
          .map((o) => (
            <button
              key={o.id}
              type="button"
              className={styles.categoryCard}
              aria-pressed={d.form === o.id}
              onClick={() => {
                d.setForm(o.id);
                advance("category");
              }}
            >
              {o.id === "open" ? (
                <Pencil aria-hidden="true" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={o.image} alt="" />
              )}
              <span>{o.label[locale]}</span>
              {d.form === o.id && (
                <Check className={styles.categorySelected} aria-hidden="true" />
              )}
            </button>
          ))}
      </div>
    ),
    size: (
      <>
        <div className={styles.sizeGrid}>
          {SIZE_OPTIONS.map((o) => (
            <label key={o.id} className={styles.sizeCard}>
              <input
                type="radio"
                name="choices-size"
                checked={d.size === o.id}
                onChange={() => {
                  d.setSize(o.id);
                  // A preset size is a single, complete choice — advance
                  // immediately. Custom dimensions still need the explicit
                  // Continue button below, since there's more to fill in.
                  if (!exact) advance("size");
                }}
              />
              <span
                className={styles.sizeDot}
                style={{ scale: String(o.scale) }}
                aria-hidden="true"
              />
              <b>{o.label[locale]}</b>
              <small>{o.hint[locale]}</small>
            </label>
          ))}
        </div>
        <label className={styles.switchRow}>
          <input
            type="checkbox"
            checked={exact}
            onChange={(e) => {
              setExactOpen(e.target.checked);
              if (!e.target.checked) {
                d.setLength("");
                d.setWidth("");
                d.setHeight("");
              }
            }}
          />
          {txt("من اندازه‌ی دقیق مد نظرم هست", "I have exact dimensions")}
        </label>
        {exact && (
          <div className={styles.dimensions}>
            {[
              [txt("طول", "Length"), d.length, d.setLength],
              [txt("عرض", "Width"), d.width, d.setWidth],
              [txt("ارتفاع", "Height"), d.height, d.setHeight],
            ].map(([label, value, set]) => (
              <label key={String(label)}>
                {String(label)}
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  inputMode="decimal"
                  value={String(value)}
                  placeholder="cm"
                  onChange={(e) =>
                    (set as (s: string) => void)(e.target.value)
                  }
                />
              </label>
            ))}
          </div>
        )}
        {continueButton(!validSize, "size")}
      </>
    ),
    color: (
      <>
        <div className={styles.colorGrid}>
          {DESIGNER_COLORS.map((o) => (
            <button
              key={o.id}
              type="button"
              aria-pressed={d.colors.includes(o.value)}
              disabled={
                !d.colors.includes(o.value) && d.colors.length >= 3
              }
              onClick={() => d.toggleColor(o.value)}
            >
              <span
                className={styles.swatch}
                style={{
                  background: "background" in o ? o.background : o.value,
                }}
              >
                {d.colors.includes(o.value) && <Check aria-hidden="true" />}
              </span>
              <small>{o.label[locale]}</small>
            </button>
          ))}
        </div>
        <button
          type="button"
          className={styles.specificBtn}
          aria-expanded={customColor}
          onClick={() => setCustomColorOpen((v) => !v)}
        >
          <Pencil aria-hidden="true" />
          {txt("من رنگ خاصی مد نظرم هست", "I have a specific color in mind")}
        </button>
        {customColor && (
          <input
            className={styles.textInput}
            aria-label={txt("رنگ دلخواه", "Custom color")}
            value={d.colorNote}
            onChange={(e) => d.setColorNote(e.target.value)}
          />
        )}
        {continueButton(false, "color")}
      </>
    ),
    similarity: (
      <>
        <div className={styles.referenceExamples}>
          {[0, 1, 2].map((i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={d.uploads[i] ?? d.uploads[0] ?? d.sketch}
              alt={txt("مرجع شما", "Your reference")}
            />
          ))}
        </div>
        <input
          className={styles.range}
          aria-label={titles.similarity}
          type="range"
          min="0"
          max="100"
          step="50"
          value={d.freedom}
          onChange={(e) => d.setFreedom(Number(e.target.value))}
        />
        <div className={styles.rangeLabels}>
          <span>{txt("کاملاً شبیه", "Very close")}</span>
          <span>{txt("با کمی تغییر", "Some changes")}</span>
          <span>{txt("فقط الهام بگیریم", "Just inspiration")}</span>
        </div>
        <p className={styles.callout}>
          {txt(
            "ما فرم کلی و حس طرح رو در نظر می‌گیریم و با توجه به امکان ساخت، پیشنهاد می‌دیم.",
            "We consider the shape and feel, then suggest what can be made by hand.",
          )}
        </p>
        {continueButton(false, "similarity")}
      </>
    ),
    budget: rows("choices-budget", BUDGET_OPTIONS, d.budget, (id) => {
      d.setBudget(id);
      advance("budget");
    }),
    timeline: (
      <>
        {rows("choices-time", TIMELINE_OPTIONS, d.timeline, (id) => {
          d.chooseTimeline(id);
          // Every option except "a specific date" is a complete answer on
          // its own; "date" still needs the date field below before this
          // can advance, so it keeps the explicit Continue button.
          if (id !== "date") advance("timeline");
        })}
        {d.timeline === "date" && (
          <label className={styles.dateRow}>
            {txt("چه تاریخی؟", "Which date?")}
            <input
              type="date"
              value={d.needBy}
              onChange={(e) => d.setNeedBy(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
            />
          </label>
        )}
        {continueButton(!d.timeline || !validDate, "timeline")}
      </>
    ),
  };

  const hints: Partial<Record<SectionId, string>> = {
    category: txt("یه دسته‌بندی اولیه رو انتخاب کن.", "Choose a starting category."),
    color: txt("می‌تونی تا سه رنگ انتخاب کنی.", "Choose up to three colors."),
    budget: txt(
      "فقط می‌پرسیم که پیشنهادهای ما به بودجه‌ات بخوره، نگران نباش.",
      "This helps us suggest something within your budget.",
    ),
  };

  return (
    <div className={styles.choices}>
      <h1 className={styles.pageTitle}>{txt("انتخاب‌ها", "Choices")}</h1>
      <p className={styles.pageHint}>
        {txt(
          "در هر بخش یکی رو انتخاب کن. هر وقت خواستی می‌تونی برگردی و تغییرش بدی.",
          "Pick one in each section — you can always come back and change it.",
        )}
      </p>
      {order.map((id, index) => {
        const isOpen = safeOpenId === id;
        const isReached = index <= reachedIndex;
        if (!isReached) return null;
        const answered = index < reachedIndex;
        return (
          <section
            key={id}
            ref={registerSection(id)}
            className={styles.section}
            data-open={isOpen}
            aria-labelledby={`choices-heading-${id}`}
          >
            {answered && !isOpen ? (
              <button
                type="button"
                className={styles.summaryRow}
                onClick={() => onOpenIdChange(id)}
              >
                <span className={styles.summaryIndex}>{index + 1}</span>
                <span className={styles.summaryText}>
                  <b id={`choices-heading-${id}`}>{titles[id]}</b>
                  <small>{summaries[id] || "—"}</small>
                </span>
                <Pencil className={styles.summaryEdit} aria-hidden="true" />
              </button>
            ) : (
              <>
                <header className={styles.sectionHead}>
                  <span className={styles.sectionIndex}>{index + 1}</span>
                  <div>
                    <h2 id={`choices-heading-${id}`}>{titles[id]}</h2>
                    {hints[id] && <p>{hints[id]}</p>}
                  </div>
                </header>
                <div className={styles.sectionBody}>{content[id]}</div>
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}
