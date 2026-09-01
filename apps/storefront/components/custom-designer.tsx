"use client";

import { FormEvent, useRef, useState } from "react";
import type { ProductCategory } from "@rad/types";
import { ArtworkVisual } from "./site";
import { useLocale } from "./i18n";
import {
  artworkCategories,
  artworkCategoryById,
  designDirections,
  designPresets,
} from "@/lib/artwork";

export function CustomDesigner() {
  const { t, locale } = useLocale();
  const [category, setCategory] = useState<ProductCategory | "">("");
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  const [brief, setBrief] = useState<Record<string, string>>({});
  const [direction, setDirection] = useState(0);
  const abort = useRef<AbortController | null>(null);
  const selectedCategory = category ? artworkCategoryById(category) : null;
  const presets = designPresets[locale];
  const directions = designDirections[locale];

  function chooseCategory(next: ProductCategory) {
    setCategory(next);
    setBrief({});
    setImage("");
    setStatus("idle");
    setError("");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!category || !prompt.trim() || status === "loading") return;
    setStatus("loading");
    setError("");
    abort.current = new AbortController();
    try {
      const response = await fetch("/backend/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: [
            selectedCategory?.label[locale],
            prompt,
            ...Object.values(brief).filter(Boolean),
            directions[direction],
          ].join("، "),
        }),
        signal: abort.current.signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("designError"));
      setImage(data.image);
      setStatus("done");
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError((err as Error).message);
        setStatus("error");
      } else setStatus("idle");
    }
  }

  return (
    <div className="designer-grid">
      <form className="designer-form" onSubmit={submit} noValidate>
        <span className="eyebrow">{t("designerEyebrow")}</span>
        <h1>
          {locale === "fa"
            ? "چیزی را که هنوز وجود ندارد، تصور کن."
            : "Imagine what does not exist yet."}
        </h1>
        <p>
          {locale === "fa"
            ? "رَد شما را به هنرمند و مسیر ساخت مناسب متصل می‌کند."
            : "RAD connects your idea to the right maker and process."}
        </p>

        <fieldset className="design-category-fieldset">
          <legend>
            <small>{locale === "fa" ? "مرحله اول" : "STEP ONE"}</small>
            {locale === "fa"
              ? "چه نوع اثری می‌خواهید؟"
              : "What would you like to commission?"}
          </legend>
          <div className="design-category-grid">
            {artworkCategories.map((item) => (
              <button
                type="button"
                key={item.id}
                className={category === item.id ? "active" : ""}
                onClick={() => chooseCategory(item.id)}
                aria-pressed={category === item.id}
              >
                <span
                  className={`category-swatch ${item.visual}`}
                  style={
                    {
                      "--swatch": item.preview.color,
                      "--swatch-accent": item.preview.accent,
                    } as React.CSSProperties
                  }
                  aria-hidden="true"
                />
                {item.label[locale]}
              </button>
            ))}
          </div>
        </fieldset>

        {selectedCategory && (
          <fieldset className="brief-fields">
            <legend>
              <small>{locale === "fa" ? "مرحله دوم" : "STEP TWO"}</small>
              {locale === "fa"
                ? `جزئیات ${selectedCategory.shortLabel.fa}`
                : `${selectedCategory.shortLabel.en} details`}
            </legend>
            {selectedCategory.fields.map((field) => (
              <div className="brief-choice" key={field.key}>
                <span>{field.label[locale]}</span>
                <div>
                  {field.options[locale].map((option) => (
                    <button
                      type="button"
                      key={option}
                      className={brief[field.key] === option ? "active" : ""}
                      onClick={() =>
                        setBrief((current) => ({
                          ...current,
                          [field.key]: option,
                        }))
                      }
                      aria-pressed={brief[field.key] === option}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </fieldset>
        )}

        <label htmlFor="artwork-prompt">{t("promptLabel")}</label>
        <textarea
          id="artwork-prompt"
          className="resize-none designer-prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={
            category
              ? t("promptPlaceholder")
              : locale === "fa"
                ? "ابتدا نوع اثر را انتخاب کنید…"
                : "Choose an artwork category first…"
          }
          aria-describedby="prompt-help"
          disabled={!category}
        />
        <small id="prompt-help">{t("promptHelp")}</small>

        <div
          className="preset-row"
          aria-label={locale === "fa" ? "واژه‌های پیشنهادی" : "Suggested words"}
        >
          {presets.map((preset) => (
            <button
              type="button"
              key={preset}
              disabled={!category}
              onClick={() =>
                setPrompt(
                  (current) =>
                    `${current}${current ? (locale === "fa" ? "، " : ", ") : ""}${preset}`,
                )
              }
            >
              {preset}
            </button>
          ))}
        </div>

        <div
          className="concept-directions"
          aria-label={locale === "fa" ? "جهت طراحی" : "Design direction"}
        >
          {directions.map((label, index) => (
            <button
              type="button"
              key={label}
              className={direction === index ? "active" : ""}
              onClick={() => setDirection(index)}
              aria-pressed={direction === index}
            >
              <small>0{index + 1}</small>
              <span>{label}</span>
            </button>
          ))}
        </div>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          {status === "loading" ? (
            <button
              type="button"
              className="button danger"
              onClick={() => abort.current?.abort()}
            >
              {t("stopGeneration")}
            </button>
          ) : (
            <button
              type="submit"
              className="button"
              disabled={!category || !prompt.trim()}
            >
              {locale === "fa" ? "تصورش کن →" : "Imagine it →"}
            </button>
          )}
        </div>
      </form>

      <section className={`designer-preview ${status}`} aria-live="polite">
        {image ? (
          <img src={image} alt={t("generatedAlt")} />
        ) : selectedCategory ? (
          <>
            <div className="preview-orbit" />
            <ArtworkVisual
              visual={selectedCategory.visual}
              color={selectedCategory.preview.color}
              accent={selectedCategory.preview.accent}
              className="designer-artwork"
            />
            <p>{status === "loading" ? t("generating") : t("preview")}</p>
          </>
        ) : (
          <div className="designer-empty-preview">
            <span>1 / 1</span>
            <p>
              {locale === "fa"
                ? "برای شروع، نوع اثر را انتخاب کنید."
                : "Choose an artwork category to begin."}
            </p>
          </div>
        )}
        {status === "done" && (
          <div className="preview-actions">
            <button
              type="button"
              className="button light"
              onClick={() => setStatus("idle")}
            >
              {t("anotherVersion")}
            </button>
            <a
              className="button"
              href="mailto:studio@rad.ir?subject=Custom artwork"
            >
              {t("talkArtist")}
            </a>
          </div>
        )}
      </section>
    </div>
  );
}
