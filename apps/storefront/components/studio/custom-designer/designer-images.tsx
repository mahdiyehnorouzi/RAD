"use client";

import { ChangeEvent, useRef } from "react";
import { useLocale } from "@/components/i18n";

const allowed = [/^image\/jpeg$/, /^image\/png$/, /^image\/webp$/];
const maxBytes = 2 * 1024 * 1024;

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read"));
    reader.readAsDataURL(file);
  });
}

export function DesignerImages({
  uploads,
  maxImages,
  error,
  onError,
  onAdd,
  onRemove,
}: {
  uploads: string[];
  maxImages: number;
  error: string;
  onError: (message: string) => void;
  onAdd: (files: string[]) => void;
  onRemove: (index: number) => void;
}) {
  const { t, number } = useLocale();
  const input = useRef<HTMLInputElement>(null);

  async function pick(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    const accepted: string[] = [];
    for (const file of files) {
      if (!allowed.some((type) => type.test(file.type)) || file.size > maxBytes) {
        onError(t("designerImageError"));
        continue;
      }
      accepted.push(await readFile(file));
    }
    if (accepted.length) {
      onError("");
      onAdd(accepted);
    }
  }

  return (
    <fieldset className="designer-images">
      <legend>
        <small>{t("stageOf", { current: number(4), total: number(5) })}</small>
        {t("designerAddImages")}
      </legend>
      <p>{t("designerImagesHelp")}</p>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={pick}
      />
      <button
        type="button"
        className="button outline"
        disabled={uploads.length >= maxImages}
        onClick={() => input.current?.click()}
      >
        {t("designerAddImages")}
      </button>
      {uploads.length ? (
        <ul className="designer-upload-grid" aria-label={t("designerYourImages")}>
          {uploads.map((src, index) => (
            <li key={`${index}-${src.slice(-12)}`}>
              <img src={src} alt="" />
              <button type="button" onClick={() => onRemove(index)}>
                {t("designerRemoveImage")}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
