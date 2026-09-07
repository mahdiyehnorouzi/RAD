"use client";
import "./custom-designer.css";

import { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArtworkVisual } from "@/components/product";
import { useLocale } from "@/components/i18n";
import { useCommerce } from "@/components/commerce";
import { useMaking } from "@/hooks/use-making-workspace";
import { MakingRequest } from "./making-request";
import { DesignerNav } from "./designer-nav";
import { DesignerImages } from "./designer-images";
import { useDesigner } from "./hooks";
import { useBackNavigation } from "@/hooks/use-back-navigation";
import {
  artworkCategories,
  designDirections,
  designPresets,
} from "@/lib/catalog/artwork";

export function CustomDesigner() {
  const { t, locale, number } = useLocale();
  const router = useRouter();
  const { goBack: leaveStudio } = useBackNavigation();
  const { user } = useCommerce();
  const { submitDesign } = useMaking();
  const designer = useDesigner();
  const {
    abort,
    brief,
    canAdvance,
    category,
    chooseCategory,
    direction,
    error,
    goBack,
    goNext,
    goTo,
    image,
    intendedUse,
    prompt,
    reachedIndex,
    selectedCategory,
    setBrief,
    setDirection,
    setError,
    setImage,
    setIntendedUse,
    setPrompt,
    setStatus,
    status,
    step,
    uploads,
  } = designer;
  const presets = designPresets[locale];
  const directions = designDirections[locale];

  async function generate(event: FormEvent) {
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

  function submitCommission() {
    if (!canAdvance) return;
    void (async () => {
      const commission = await submitDesign({
        customerName: user?.name ?? (locale === "fa" ? "مهمان" : "Guest"),
        brief: {
          concept: prompt.trim() || (locale === "fa" ? "طرح استودیو" : "Studio concept"),
          dimensions: brief.size ?? "",
          material: selectedCategory?.label[locale] ?? "",
          intendedUse,
          budget: brief.budget ?? "",
          permission: "material",
          category: category || "ceramics",
          image: image || uploads[0],
          images: uploads,
        },
      });
      router.push(`/making/${commission.id}`);
    })();
  }

  return (
    <div className="designer-shell">
      <DesignerNav
        step={step}
        reachedIndex={reachedIndex}
        number={number}
        onSelect={goTo}
      />
      <div className="designer-grid">
        <form
          className="designer-form"
          onSubmit={step === "images" ? generate : (event) => event.preventDefault()}
          noValidate
        >
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
          {step === "type" ? <p className="designer-free-note">{t("designerFreeIdea")}</p> : null}

          {step === "type" ? (
            <fieldset className="design-category-fieldset">
              <legend>
                <small>{t("stepOne")}</small>
                {t("chooseArtworkType")}
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
          ) : null}

          {step === "details" && selectedCategory ? (
            <fieldset className="brief-fields">
              <legend>
                <small>{t("stepTwo")}</small>
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
          ) : null}

          {step === "idea" ? (
            <>
              <label htmlFor="artwork-prompt">{t("promptLabel")}</label>
              <textarea
                id="artwork-prompt"
                className="resize-none designer-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder={t("promptPlaceholder")}
                aria-describedby="prompt-help"
              />
              <small id="prompt-help">{t("promptHelp")}</small>
              <div className="preset-row" aria-label={t("suggestedWords")}>
                {presets.map((preset) => (
                  <button
                    type="button"
                    key={preset}
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
              <div className="concept-directions" aria-label={t("designDirection")}>
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
            </>
          ) : null}

          {step === "images" ? (
            <>
              <DesignerImages
                uploads={uploads}
                maxImages={designer.maxImages}
                error={error}
                onError={setError}
                onAdd={designer.addUploads}
                onRemove={designer.removeUpload}
              />
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
                  <button type="submit" className="button" disabled={!prompt.trim()}>
                    {locale === "fa" ? t("imagineIt") : t("imagineIt")}
                  </button>
                )}
              </div>
            </>
          ) : null}

          {step === "send" ? (
            <MakingRequest
              intendedUse={intendedUse}
              setIntendedUse={setIntendedUse}
              onSubmit={submitCommission}
            />
          ) : null}

          {step !== "send" ? (
            <div className="designer-step-actions">
              <button
                type="button"
                className="button outline designer-back"
                onClick={step === "type" ? leaveStudio : goBack}
              >
                {t("designerBack")}
              </button>
              <button
                type="button"
                className="button"
                disabled={!canAdvance}
                onClick={goNext}
              >
                {step === "images" && !uploads.length && !image
                  ? t("designerSkipImages")
                  : t("designerNext")}
              </button>
            </div>
          ) : (
            <div className="designer-step-actions">
              <button type="button" className="button outline designer-back" onClick={goBack}>
                {t("designerBack")}
              </button>
            </div>
          )}
        </form>

        <section className={`designer-preview ${status}`} aria-live="polite">
          {image ? (
            <img src={image} alt={t("generatedAlt")} />
          ) : uploads[0] ? (
            <img src={uploads[0]} alt={t("designerYourImages")} />
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
              <p>{t("chooseCategoryToBegin")}</p>
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
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
