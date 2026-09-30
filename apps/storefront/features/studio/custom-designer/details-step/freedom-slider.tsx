"use client";

import { useLocale } from "@/components/i18n";
import { designerCopy, fidelityKey } from "../const";
import styles from "./freedom-slider.module.css";
import shell from "../custom-designer.module.css";

export function FreedomSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const { locale } = useLocale();
  const c = designerCopy[locale];
  const phrase = c[fidelityKey(value)];

  return (
    <fieldset className={`${shell.cdField} freedom`}>
      <legend>{c.fidelityLabel}</legend>
      <input
        id="fidelity-range"
        className={styles.freedomRange}
        type="range"
        min={0}
        max={100}
        value={value}
        style={{ "--fill": `${value}%` } as React.CSSProperties}
        aria-label={c.fidelityLabel}
        aria-valuetext={phrase}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className={styles.freedomEnds} aria-hidden="true">
        <span>
          <b>{c.fidelityLow}</b>
          <small>{c.fidelityLowHint}</small>
        </span>
        <span>
          <b>{c.fidelityHigh}</b>
          <small>{c.fidelityHighHint}</small>
        </span>
      </div>
    </fieldset>
  );
}
