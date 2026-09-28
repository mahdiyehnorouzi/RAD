"use client";

import { useId, useState, type ChangeEvent, type Ref } from "react";
import { Camera } from "lucide-react";
import { useLocale } from "@/components/i18n";
import { prepareImage } from "@/lib/media/prepare-image";
import { damageReportCopy } from "./const";

export function DamagePhotoField({
  ref,
  label,
  alt,
  value,
  invalid,
  disabled,
  onChange,
}: {
  ref?: Ref<HTMLInputElement>;
  label: string;
  alt: string;
  value: string;
  invalid?: boolean;
  disabled?: boolean;
  onChange: (dataUrl: string) => void;
}) {
  const { locale } = useLocale();
  const c = damageReportCopy[locale];
  const id = useId();
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState("");

  const pick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setPreparing(true);
    setError("");
    const result = await prepareImage(file);
    setPreparing(false);
    if (result.ok) onChange(result.dataUrl);
    else setError(c.photoError);
  };

  return (
    <div
      className={invalid && !value ? "damage-photo is-invalid" : "damage-photo"}
    >
      <span className="damage-photo-label" id={`${id}-label`}>
        {label}
      </span>
      <label className="damage-photo-drop" htmlFor={id}>
        {value ? (
          <img src={value} alt={alt} />
        ) : (
          <Camera size={22} strokeWidth={1.5} aria-hidden="true" />
        )}
        <span>
          {preparing ? c.preparing : value ? c.replacePhoto : c.choosePhoto}
        </span>
      </label>
      <input
        ref={ref}
        id={id}
        className="damage-photo-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-labelledby={`${id}-label`}
        aria-invalid={(invalid && !value) || Boolean(error) || undefined}
        disabled={disabled || preparing}
        onChange={pick}
      />
      {error ? (
        <p className="damage-field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
