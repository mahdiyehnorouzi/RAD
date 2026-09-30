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
import styles from "./details-step.module.css";
import shell from "../custom-designer.module.css";

const LIGHT_SWATCHES = new Set(["sand", "cream"]);

export function DetailsStep({ designer }: { designer: Designer }) {
  const { locale } = useLocale();
  const c = designerCopy[locale];
  const art =
    FORM_OPTIONS.find((option) => option.id === designer.form)?.image ??
    FORM_OPTIONS[0].image;
  const size =
    SIZE_OPTIONS.find((option) => option.id === designer.size) ??
    SIZE_OPTIONS[1];
  const full = designer.colors.length >= MAX_DESIGNER_COLORS;
  const dims = [
    {
      id: "length",
      label: c.length,
      value: designer.length,
      set: designer.setLength,
    },
    {
      id: "width",
      label: c.width,
      value: designer.width,
      set: designer.setWidth,
    },
    {
      id: "height",
      label: c.height,
      value: designer.height,
      set: designer.setHeight,
    },
  ];

  return (
    <div className={shell.cdStep}>
      <header className={shell.cdStepHead}>
        <h3>{c.detailsTitle}</h3>
        <p>{c.detailsHelp}</p>
      </header>

      <fieldset className={shell.cdField}>
        <legend>{c.sizeLabel}</legend>
        <div className={styles.sizeStage}>
          <span className={styles.sizePreview} aria-hidden="true">
            <span style={{ transform: `scale(${size.scale})` }}>
              <Image src={art} alt="" fill sizes="15rem" />
            </span>
          </span>
          <div className={styles.sizeTrack}>
            {SIZE_OPTIONS.map((option) => {
              const checked = designer.size === option.id;
              return (
                <label
                  key={option.id}
                  className={`${shell.cdChoice} ${styles.sizeStop}${checked ? ` ${styles.checked}` : ""}`}
                >
                  <input
                    type="radio"
                    name="order-size"
                    value={option.id}
                    checked={checked}
                    onChange={() => designer.setSize(option.id)}
                  />
                  <i className={styles.sizeDot} aria-hidden="true" />
                  <span>{option.label[locale]}</span>
                </label>
              );
            })}
          </div>
          <p className={styles.sizeReadout} aria-live="polite">
            <StudioIcon name="ruler" size={18} />
            <b>{size.label[locale]}</b>
            <span>{size.hint[locale]}</span>
          </p>
        </div>
      </fieldset>

      <fieldset className={shell.cdField}>
        <legend>{c.exactLabel}</legend>
        <div className={styles.dims}>
          {dims.map((dim) => (
            <label key={dim.id} className={`${shell.cdBox} ${styles.dimBox}`}>
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

      <fieldset className={shell.cdField}>
        <legend>
          {c.colorsLabel}{" "}
          <small className={styles.cdLegendHint}>{c.colorsHint}</small>
        </legend>
        <div className={styles.swatches}>
          {DESIGNER_COLORS.map((color) => {
            const checked = designer.colors.includes(color.value);
            return (
              <label
                key={color.id}
                className={`${styles.swatch}${checked ? ` ${styles.checked}` : ""}${full && !checked ? ` ${styles.disabled}` : ""}${LIGHT_SWATCHES.has(color.id) ? ` ${styles.light}` : ""}`}
                style={{ "--swatch": color.value } as React.CSSProperties}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={full && !checked}
                  onChange={() => designer.toggleColor(color.value)}
                  aria-label={color.label[locale]}
                />
                <span className={styles.swatchChip} aria-hidden="true">
                  {checked ? <StudioIcon name="check" size={16} /> : null}
                </span>
                <span className={styles.swatchName} aria-hidden="true">
                  {color.label[locale]}
                </span>
              </label>
            );
          })}
        </div>
        <label className={shell.cdSublabel} htmlFor="color-note">
          {c.colorNoteLabel}
        </label>
        <span className={`${shell.cdBox} ${shell.cdIconInput}`}>
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
