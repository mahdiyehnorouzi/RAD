"use client";

import { ChangeEvent, useRef, useState } from "react";
import { useLocale } from "@/components/i18n";
import { prepareImage } from "@/lib/media/prepare-image";

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
  const [processing, setProcessing] = useState(false);

  async function pick(event: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!picked.length) return;
    const room = Math.max(0, maxImages - uploads.length);
    const files = picked.slice(0, room);
    const messages: string[] = [];
    if (picked.length > room)
      messages.push(t("designerImageLimit", { count: number(maxImages) }));

    setProcessing(true);
    const accepted: string[] = [];
    for (const file of files) {
      const result = await prepareImage(file);
      if (result.ok) {
        accepted.push(result.dataUrl);
        continue;
      }
      const name = file.name;
      if (result.reason === "type")
        messages.push(t("designerImageTypeError", { name }));
      else if (result.reason === "size")
        messages.push(
          t("designerImageTooLarge", {
            name,
            size: number(Math.round((file.size / 1024 / 1024) * 10) / 10),
          }),
        );
      else if (result.reason === "corrupt")
        messages.push(t("designerImageCorrupt", { name }));
      else messages.push(t("designerImageUploadFailed", { name }));
    }
    setProcessing(false);
    if (accepted.length) onAdd(accepted);
    onError(messages.join("\n"));
  }

  return (
    <fieldset className="designer-images" aria-busy={processing}>
      <legend>{t("designerAddImages")}</legend>
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
        disabled={uploads.length >= maxImages || processing}
        onClick={() => input.current?.click()}
      >
        {processing ? t("designerImageProcessing") : t("designerAddImages")}
      </button>
      {uploads.length ? (
        <ul
          className="designer-upload-grid"
          aria-label={t("designerYourImages")}
        >
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
        <p className="form-error designer-image-errors" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
