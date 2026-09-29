"use client";

import Image from "next/image";
import { useLocale } from "@/components/i18n";
import { StudioIcon } from "../../studio-icon";
import {
  DESIGNER_COLORS,
  FORM_OPTIONS,
  MAX_DESIGNER_COLORS,
  SIZE_OPTIONS,
  designerCopy,
} from "../const";
import type { Designer } from "../hooks";
import { FreedomSlider } from "./freedom-slider";
import "./details-step.css";

const LIGHT_SWATCHES = new Set(["sand", "cream"]);

export function DetailsStep({ designer }: { designer: Designer }) {
  const { locale } = useLocale();
  const c = designerCopy[locale];
  const art =
    FORM_OPTIONS.find((option) => option.id === designer.form)?.image ??
    FORM_OPTIONS[0].image;
  const size = SIZE_OPTIONS.find((option) => option.id === designer.size) ?? SIZE_OPTIONS[1];
  const full = designer.colors.length >= MAX_DESIGNER_COLORS;
  const dims = [
    { id: "length", label: c.length, value: designer.length, set: designer.setLength },
    { id: "width", label: c.width, value: designer.width, set: designer.setWidth },
    { id: "height", label: c.height, value: designer.height, set: designer.setHeight },
  ];

  return (
    <div className="cd-step details-step">
      <header className="cd-step-head">
        <h3>{c.detailsTitle}</h3>
        <p>{c.detailsHelp}</p>
      </header>

      <fieldset className="cd-field">
        <legend>{c.sizeLabel}</legend>
        <div className="size-stage">
          <span className="size-preview" aria-hidden="true">
            <span style={{ transform: `scale(${size.scale})` }}>
              <Image src={art} alt="" fill sizes="15rem" />
            </span>
          </span>
          <div className="size-track">
            {SIZE_OPTIONS.map((option) => {
              const checked = designer.size === option.id;
              return (
                <label
                  key={option.id}
                  className={`cd-choice size-stop${checked ? " is-checked" : ""}`}
                >
                  <input
                    type="radio"
                    name="order-size"
                    value={option.id}
                    checked={checked}
                    onChange={() => designer.setSize(option.id)}
                  />
                  <i className="size-dot" aria-hidden="true" />
                  <span>{option.label[locale]}</span>
                </label>
              );
            })}
          </div>
          <p className="size-readout" aria-live="polite">
            <StudioIcon name="ruler" size={18} />
            <b>{size.label[locale]}</b>
            <span>{size.hint[locale]}</span>
          </p>
        </div>
      </fieldset>

      <fieldset className="cd-field">
        <legend>{c.exactLabel}</legend>
        <div className="dims">
          {dims.map((dim) => (
            <label key={dim.id} className="cd-box dim-box">
              <span>{dim.label}</span>
              <input
                inputMode="decimal"
                value={dim.value}
                onChange={(event) => dim.set(event.target.value.slice(0, 8))}
                aria-label={`${dim.label} (${c.unit})`}
              />
              <small aria-hidden="true">{c.unit}</small>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="cd-field">
        <legend>
          {c.colorsLabel} <small className="cd-legend-hint">{c.colorsHint}</small>
        </legend>
        <div className="swatches">
          {DESIGNER_COLORS.map((color) => {
            const checked = designer.colors.includes(color.value);
            return (
              <label
                key={color.id}
                className={`swatch${checked ? " is-checked" : ""}${full && !checked ? " is-disabled" : ""}${LIGHT_SWATCHES.has(color.id) ? " is-light" : ""}`}
                style={{ "--swatch": color.value } as React.CSSProperties}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={full && !checked}
                  onChange={() => designer.toggleColor(color.value)}
                  aria-label={color.label[locale]}
                />
                <span className="swatch-chip" aria-hidden="true">
                  {checked ? <StudioIcon name="check" size={16} /> : null}
                </span>
                <span className="swatch-name" aria-hidden="true">
                  {color.label[locale]}
                </span>
              </label>
            );
          })}
        </div>
        <label className="cd-sublabel" htmlFor="color-note">
          {c.colorNoteLabel}
        </label>
        <span className="cd-box cd-icon-input">
          <StudioIcon name="palette" size={20} />
          <input
            id="color-note"
            value={designer.colorNote}
            maxLength={120}
            onChange={(event) => designer.setColorNote(event.target.value)}
            placeholder={c.colorNotePlaceholder}
          />
        </span>
      </fieldset>

      <FreedomSlider value={designer.freedom} onChange={designer.setFreedom} />
    </div>
  );
}
