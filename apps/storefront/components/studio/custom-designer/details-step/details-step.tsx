"use client";

import { useEffect, useRef } from "react";
import { Plus, X } from "lucide-react";
import { useLocale } from "@/components/i18n";
import {
  DESIGNER_COLORS,
  MAX_DESIGNER_COLORS,
  SIZE_OPTIONS,
  designerCopy,
} from "../const";
import type { Designer } from "../hooks";
import { FreedomSlider } from "./freedom-slider";
import "./details-step.css";

const presetValues: string[] = DESIGNER_COLORS.map((color) => color.value);

export function DetailsStep({ designer }: { designer: Designer }) {
  const { locale } = useLocale();
  const c = designerCopy[locale];
  const size = SIZE_OPTIONS[designer.sizeIndex] ?? SIZE_OPTIONS[0];
  const sizeText = `${size.label[locale]} — ${size.hint[locale]}`;
  const customColors = designer.colors.filter((value) => !presetValues.includes(value));
  const full = designer.colors.length >= MAX_DESIGNER_COLORS;
  const picker = useRef<HTMLInputElement>(null);
  const { toggleColor } = designer;

  // The native "change" fires once when the picker closes; React's onChange fires on every drag.
  useEffect(() => {
    const input = picker.current;
    if (!input) return undefined;
    const commit = () => toggleColor(input.value);
    input.addEventListener("change", commit);
    return () => input.removeEventListener("change", commit);
  }, [toggleColor]);

  return (
    <div className="designer-step details-step">
      <header className="designer-step-head">
        <h3>{c.detailsTitle}</h3>
        <p>{c.detailsHelp}</p>
      </header>

      <fieldset className="details-field">
        <legend>{c.sizeLabel}</legend>
        <output className="details-readout" htmlFor="size-range">
          {size.label[locale]} <small>{size.hint[locale]}</small>
        </output>
        <div className="details-scale">
          <div className="details-stops" aria-hidden="true">
            {SIZE_OPTIONS.map((option, index) => (
              <i key={option.id} className={index <= designer.sizeIndex ? "is-past" : ""} />
            ))}
          </div>
          <input
            id="size-range"
            className="details-range"
            type="range"
            min={0}
            max={SIZE_OPTIONS.length - 1}
            step={1}
            value={designer.sizeIndex}
            aria-label={c.sizeLabel}
            aria-valuetext={sizeText}
            onChange={(event) => designer.setSizeIndex(Number(event.target.value))}
          />
        </div>
        <div className="details-ends" aria-hidden="true">
          <span>{c.sizeSmall}</span>
          <span>{c.sizeLarge}</span>
        </div>
        <label className="details-exact" htmlFor="making-dimensions">
          {c.exactSizeLabel}
        </label>
        <input
          id="making-dimensions"
          className="details-input"
          value={designer.dimensions}
          onChange={(event) => designer.setDimensions(event.target.value)}
          placeholder={c.exactSizePlaceholder}
        />
      </fieldset>

      <fieldset className="details-field details-colors">
        <legend>{c.colorsLabel}</legend>
        <small>{c.colorsHelp}</small>
        <div>
          {DESIGNER_COLORS.map((color) => {
            const active = designer.colors.includes(color.value);
            return (
              <button
                key={color.id}
                type="button"
                className={active ? "active" : ""}
                style={{ background: color.value }}
                aria-pressed={active}
                aria-label={color.label[locale]}
                disabled={full && !active}
                onClick={() => designer.toggleColor(color.value)}
              />
            );
          })}
          {customColors.map((value) => (
            <button
              key={value}
              type="button"
              className="active is-custom"
              style={{ background: value }}
              aria-label={`${c.removeColor} ${value}`}
              onClick={() => designer.toggleColor(value)}
            >
              <X aria-hidden="true" size={12} strokeWidth={2} />
            </button>
          ))}
          <label className={`details-color-picker${full ? " is-disabled" : ""}`}>
            <input
              ref={picker}
              type="color"
              defaultValue="#8a4938"
              disabled={full}
              aria-label={c.customColor}
            />
            <Plus aria-hidden="true" size={14} strokeWidth={1.8} />
            <span>{c.customColor}</span>
          </label>
        </div>
      </fieldset>

      <FreedomSlider value={designer.freedom} onChange={designer.setFreedom} />
    </div>
  );
}
