"use client";

import { ChangeEvent, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { useLocale } from "@/components/i18n";
import { prepareImage } from "@/lib/media/prepare-image";
import { collaborateCopy } from "./const";
import styles from "./collaboration.module.css";

export function ArtworkImages({
  images,
  maxImages,
  error,
  onError,
  onAdd,
  onRemove,
}: {
  images: string[];
  maxImages: number;
  error: string;
  onError: (message: string) => void;
  onAdd: (files: string[]) => void;
  onRemove: (index: number) => void;
}) {
  const { locale, number } = useLocale();
  const c = collaborateCopy[locale];
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);

  async function pick(event: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!picked.length) return;
    const room = Math.max(0, maxImages - images.length);
    const files = picked.slice(0, room);
    const messages: string[] = [];
    if (picked.length > room) {
      messages.push(c.imageLimit.replace("{count}", String(number(maxImages))));
    }

    setProcessing(true);
    const accepted: string[] = [];
    for (const file of files) {
      const result = await prepareImage(file);
      if (result.ok) {
        accepted.push(result.dataUrl);
        continue;
      }
      const name = file.name;
      if (result.reason === "type") messages.push(c.imageTypeError);
      else if (result.reason === "size")
        messages.push(c.imageTooLarge.replace("{name}", name));
      else if (result.reason === "corrupt")
        messages.push(c.imageCorrupt.replace("{name}", name));
      else messages.push(c.imageUploadFailed.replace("{name}", name));
    }
    setProcessing(false);
    if (accepted.length) onAdd(accepted);
    onError(messages.join("\n"));
  }

  return (
    <div className={styles.images} aria-busy={processing}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={pick}
      />
      <ul className={styles.imageGrid}>
        {images.map((src, index) => (
          <li key={`${index}-${src.slice(-12)}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" />
            <button
              type="button"
              className={styles.imageRemove}
              aria-label={c.removeImage}
              onClick={() => onRemove(index)}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </li>
        ))}
        {images.length < maxImages ? (
          <li>
            <button
              type="button"
              className={styles.imageAdd}
              disabled={processing}
              onClick={() => inputRef.current?.click()}
            >
              <Plus aria-hidden="true" />
              <span>{images.length ? c.addAnotherImage : c.addImage}</span>
            </button>
          </li>
        ) : null}
      </ul>
      <small className={styles.imageHint}>{c.maxImagesHint}</small>
      {error ? (
        <p className={styles.fieldError} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
