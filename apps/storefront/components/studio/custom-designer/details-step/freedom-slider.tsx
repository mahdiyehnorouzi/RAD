"use client";

import { useLocale } from "@/components/i18n";
import { designerCopy, fidelityKey } from "../const";

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
    <fieldset className="details-field freedom-slider">
      <legend>{c.fidelityLabel}</legend>
      <output className="details-readout" htmlFor="fidelity-range">
        {phrase}
      </output>
      <input
        id="fidelity-range"
        className="details-range"
        type="range"
        min={0}
        max={100}
        value={value}
        aria-label={c.fidelityLabel}
        aria-valuetext={phrase}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className="details-ends" aria-hidden="true">
        <span>{c.fidelityLow}</span>
        <span>{c.fidelityHigh}</span>
      </div>
    </fieldset>
  );
}
