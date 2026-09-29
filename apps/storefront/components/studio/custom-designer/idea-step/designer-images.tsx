"use client";

import { ChangeEvent, RefObject, useState } from "react";
import { useLocale } from "@/components/i18n";
import { prepareImage } from "@/lib/media/prepare-image";
import { StudioIcon } from "../../studio-icon";
import { designerCopy } from "../const";

export function DesignerImages({
  inputRef,
  uploads,
  maxImages,
  error,
  onError,
  onAdd,
  onRemove,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  uploads: string[];
  maxImages: number;
  error: string;
  onError: (message: string) => void;
  onAdd: (files: string[]) => void;
  onRemove: (index: number) => void;
}) {
  const { t, number, locale } = useLocale();
  const c = designerCopy[locale];
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
    <div className="idea-images" aria-busy={processing}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={pick}
      />
      {uploads.length || processing ? (
        <ul className="idea-upload-grid" aria-label={t("designerYourImages")}>
          {uploads.map((src, index) => (
            <li key={`${index}-${src.slice(-12)}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" />
              <button
                type="button"
                className="idea-upload-remove"
                aria-label={c.removePhoto}
                onClick={() => onRemove(index)}
              >
                <StudioIcon name="close" size={16} />
              </button>
            </li>
          ))}
          {uploads.length < maxImages ? (
            <li>
              <button
                type="button"
                className="idea-upload-add"
                disabled={processing}
                onClick={() => inputRef.current?.click()}
              >
                <i aria-hidden="true">
                  <StudioIcon name="plus" size={18} />
                </i>
                <span>{processing ? t("designerImageProcessing") : c.addAnotherPhoto}</span>
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
      {error ? (
        <p className="cd-error idea-image-errors" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
