"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductCategory } from "@rad/types";
import { ArtworkVisual } from "@/components/product/artwork-visual";
import "@/components/product/artwork.css";
import { Button } from "@/components/ui/button-link";
import { Eyebrow } from "@/components/ui/section";
import { useLocale } from "@/components/i18n";
import { DifferencePortraitView } from "@/components/difference-portrait";
import { useMaking } from "@/hooks/use-making-workspace";
import { useCommerce } from "@/components/commerce/commerce-provider";
import {
  artworkCategories,
  artworkCategoryById,
  designDirections,
  designPresets,
} from "@/lib/artwork";
import {
  composeLivePortrait,
  surprisePermissions,
  type SurprisePermission,
} from "@/lib/beautiful-difference";

export function CustomDesigner() {
  const { t, locale, href } = useLocale();
  const router = useRouter();
  const { submitDesign } = useMaking();
  const { user } = useCommerce();
  const [category, setCategory] = useState<ProductCategory | "">("");
  const [prompt, setPrompt] = useState("");
  const [memory, setMemory] = useState("");
  const [permission, setPermission] =
    useState<SurprisePermission>("hand");
  const [intendedUse, setIntendedUse] = useState("");
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
  const livePortrait = useMemo(() => {
    if (status !== "done" || !selectedCategory || !prompt.trim()) return null;
    const described = [prompt.trim(), memory.trim()].filter(Boolean).join(" — ");
    return composeLivePortrait({
      prompt: described,
      category: selectedCategory.id,
      visual: selectedCategory.visual,
      permission,
      color: selectedCategory.preview.color,
      accent: selectedCategory.preview.accent,
    });
  }, [status, selectedCategory, prompt, memory, permission]);

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
      const permissionLabel =
        surprisePermissions.find((item) => item.id === permission)?.title[
          locale
        ] ?? "";
      const response = await fetch("/backend/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: [
            selectedCategory?.label[locale],
            prompt,
            memory,
            ...Object.values(brief).filter(Boolean),
            directions[direction],
            permissionLabel,
          ]
            .filter(Boolean)
            .join("، "),
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
    <>
      <div className="grid items-start gap-[clamp(2.5rem,6vw,7rem)] lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <DesignerForm
          category={category}
          prompt={prompt}
          setPrompt={setPrompt}
          memory={memory}
          setMemory={setMemory}
          permission={permission}
          setPermission={setPermission}
          status={status}
          error={error}
          brief={brief}
          setBrief={setBrief}
          direction={direction}
          setDirection={setDirection}
          chooseCategory={chooseCategory}
          submit={submit}
          abort={() => abort.current?.abort()}
          presets={presets}
          directions={directions}
        />
        <DesignerPreview
          image={image}
          status={status}
          selectedCategory={selectedCategory}
          onReset={() => setStatus("idle")}
        />
      </div>
      {status === "done" && selectedCategory ? (
        <section className="making-request mt-12">
          <Eyebrow className="text-rad-sand">{t("makingEyebrow")}</Eyebrow>
          <h2 className="m-0 text-h3 font-normal">{t("makingSubmit")}</h2>
          <p className="mt-3 max-w-2xl text-prose">{t("makingBody")}</p>
          <label className="mt-6 block" htmlFor="intended-use">
            {t("makingUseLabel")}
          </label>
          <textarea
            id="intended-use"
            value={intendedUse}
            onChange={(event) => setIntendedUse(event.target.value)}
            placeholder={t("makingUsePlaceholder")}
            aria-describedby="use-help"
          />
          <small id="use-help">{t("makingUseHelp")}</small>
          <div className="making-actions mt-6">
            <Button
              type="button"
              onClick={() => {
                const permissionLabel =
                  surprisePermissions.find((item) => item.id === permission)
                    ?.title[locale] ?? "";
                const created = submitDesign({
                  customerName:
                    user?.name || (locale === "fa" ? "مهمان رَد" : "RAD guest"),
                  title: {
                    fa: prompt.trim().slice(0, 48),
                    en: prompt.trim().slice(0, 48),
                  },
                  brief: {
                    concept: [prompt.trim(), memory.trim()]
                      .filter(Boolean)
                      .join(" — "),
                    dimensions:
                      brief.size || (locale === "fa" ? "نامشخص" : "Unspecified"),
                    material: [
                      selectedCategory.label[locale],
                      brief.surface,
                      brief.medium,
                      brief.item,
                    ]
                      .filter(Boolean)
                      .join(" · "),
                    intendedUse:
                      intendedUse.trim() ||
                      (locale === "fa" ? "نامشخص" : "Unspecified"),
                    budget:
                      brief.budget || (locale === "fa" ? "نامشخص" : "Unspecified"),
                    permission: permissionLabel,
                    category: selectedCategory.id,
                    image,
                  },
                });
                router.push(href(`/making/${created.id}`));
              }}
            >
              {t("makingSubmit")}
            </Button>
          </div>
        </section>
      ) : null}
      {livePortrait ? (
        <DifferencePortraitView
          portrait={livePortrait}
          image={image}
          privateReveal
        />
      ) : null}
    </>
  );
}

function DesignerForm({
  category,
  prompt,
  setPrompt,
  memory,
  setMemory,
  permission,
  setPermission,
  status,
  error,
  brief,
  setBrief,
  direction,
  setDirection,
  chooseCategory,
  submit,
  abort,
  presets,
  directions,
}: {
  category: ProductCategory | "";
  prompt: string;
  setPrompt: React.Dispatch<React.SetStateAction<string>>;
  memory: string;
  setMemory: React.Dispatch<React.SetStateAction<string>>;
  permission: SurprisePermission;
  setPermission: (value: SurprisePermission) => void;
  status: string;
  error: string;
  brief: Record<string, string>;
  setBrief: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  direction: number;
  setDirection: (value: number) => void;
  chooseCategory: (next: ProductCategory) => void;
  submit: (event: FormEvent) => void;
  abort: () => void;
  presets: string[];
  directions: string[];
}) {
  const { t, locale } = useLocale();
  const selectedCategory = category ? artworkCategoryById(category) : null;
  const fieldClass =
    "mt-2 min-h-[180px] w-full resize-none border-0 border-b border-rad-paper/40 bg-transparent px-0 py-2 text-rad-paper outline-none disabled:cursor-not-allowed disabled:opacity-55";

  return (
    <form
      className="bg-rad-moss p-6 text-rad-paper md:p-10"
      onSubmit={submit}
      noValidate
    >
      <Eyebrow className="text-rad-sand">{t("designerEyebrow")}</Eyebrow>
      <h1 className="m-0 text-designer font-normal">
        {t("studioImagineTitle")}
      </h1>
      <p className="mt-4 max-w-xl text-prose">{t("designerConnect")}</p>

      <fieldset className="my-9 border-0 p-0">
        <legend className="mb-4 flex w-full flex-col gap-1">
          <small className="text-caption tracking-wider text-rad-clay">
            {t("stepOne")}
          </small>
          {t("chooseArtworkType")}
        </legend>
        <div className="grid grid-cols-2 gap-px border border-rad-paper/20 bg-rad-paper/20">
          {artworkCategories.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`flex min-h-[66px] items-center gap-3 border-0 bg-rad-moss p-3 text-start text-rad-paper ${
                category === item.id
                  ? "bg-[color-mix(in_srgb,theme(colors.rad.moss)_78%,theme(colors.rad.sand))]"
                  : ""
              }`}
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
        <fieldset className="border-0 p-0">
          <legend className="mb-4 flex w-full flex-col gap-1">
            <small className="text-caption tracking-wider text-rad-clay">
              {t("stepTwo")}
            </small>
            {t("briefDetails", { name: selectedCategory.shortLabel[locale] })}
          </legend>
          {selectedCategory.fields.map((field) => (
            <div
              className="grid grid-cols-[minmax(90px,0.38fr)_1fr] gap-4 border-b border-rad-paper/20 py-4"
              key={field.key}
            >
              <span className="text-identifier text-rad-paper/70">
                {field.label[locale]}
              </span>
              <div className="flex flex-wrap gap-2">
                {field.options[locale].map((option) => (
                  <button
                    type="button"
                    key={option}
                    className={`rounded-full border px-2.5 py-1 ${
                      brief[field.key] === option
                        ? "border-rad-sand bg-rad-sand text-rad-ink"
                        : "border-rad-paper/30 bg-transparent text-rad-paper"
                    }`}
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
        className={fieldClass}
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder={
          category ? t("promptPlaceholder") : t("promptChooseCategory")
        }
        aria-describedby="prompt-help"
        disabled={!category}
      />
      <small id="prompt-help" className="mt-2 block text-rad-paper/70">
        {t("promptHelp")}
      </small>

      <label className="mt-8 block" htmlFor="artwork-memory">
        {t("memoryLabel")}
      </label>
      <textarea
        id="artwork-memory"
        className={`${fieldClass} min-h-[110px]`}
        value={memory}
        onChange={(event) => setMemory(event.target.value)}
        placeholder={t("memoryPlaceholder")}
        aria-describedby="memory-help"
        disabled={!category}
      />
      <small id="memory-help" className="mt-2 block text-rad-paper/70">
        {t("memoryHelp")}
      </small>

      <fieldset className="surprise-permission">
        <legend>
          <small>{t("surpriseLegend")}</small>
          {t("surpriseLegend")}
        </legend>
        <div className="surprise-grid" role="radiogroup" aria-label={t("surpriseLegend")}>
          {surprisePermissions.map((item) => (
            <button
              type="button"
              key={item.id}
              className={permission === item.id ? "active" : ""}
              onClick={() => setPermission(item.id)}
              aria-pressed={permission === item.id}
            >
              <b>{item.title[locale]}</b>
              <span>{item.body[locale]}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div
        className="mt-4 flex flex-wrap gap-x-5 gap-y-2"
        aria-label={t("suggestedWords")}
      >
        {presets.map((preset) => (
          <button
            type="button"
            key={preset}
            disabled={!category}
            className="border-0 border-b border-rad-paper/30 bg-transparent py-1 text-rad-paper before:text-rad-clay before:content-['+_']"
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
        className="mt-6 border-y border-rad-paper/20"
        aria-label={t("designDirection")}
      >
        {directions.map((label, index) => (
          <button
            type="button"
            key={label}
            className={`grid min-h-16 w-full grid-cols-[42px_1fr] items-center border-0 border-b border-rad-paper/20 bg-transparent text-start text-rad-paper ${
              direction === index ? "text-rad-sand" : ""
            }`}
            onClick={() => setDirection(index)}
            aria-pressed={direction === index}
          >
            <small>0{index + 1}</small>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {error && (
        <p className="text-rad-sand" role="alert">
          {error}
        </p>
      )}
      <div className="mt-6">
        {status === "loading" ? (
          <Button type="button" variant="danger" onClick={abort}>
            {t("stopGeneration")}
          </Button>
        ) : (
          <Button type="submit" disabled={!category || !prompt.trim()}>
            {t("imagineIt")}
          </Button>
        )}
      </div>
    </form>
  );
}

function DesignerPreview({
  image,
  status,
  selectedCategory,
  onReset,
}: {
  image: string;
  status: string;
  selectedCategory: ReturnType<typeof artworkCategoryById> | null | undefined;
  onReset: () => void;
}) {
  const { t } = useLocale();
  return (
    <section
      className="relative min-h-[560px] overflow-hidden bg-rad-ink text-rad-paper lg:min-h-[min(76vh,820px)]"
      aria-live="polite"
    >
      {image ? (
        <img
          src={image}
          alt={t("generatedAlt")}
          className="h-full w-full object-contain"
        />
      ) : selectedCategory ? (
        <div className="grid h-full place-items-center content-center gap-4 p-8 text-center">
          <ArtworkVisual
            visual={selectedCategory.visual}
            color={selectedCategory.preview.color}
            accent={selectedCategory.preview.accent}
            className="designer-artwork"
          />
          <p>{status === "loading" ? t("generating") : t("preview")}</p>
        </div>
      ) : (
        <div className="grid h-full place-items-center content-center gap-5 p-8 text-center">
          <span className="grid aspect-square w-[78px] place-items-center rounded-full border border-current text-caption">
            1 / 1
          </span>
          <p className="max-w-xs text-rad-muted">
            {t("chooseCategoryToBegin")}
          </p>
        </div>
      )}
      {status === "done" && (
        <div className="absolute inset-x-0 bottom-6 flex justify-center gap-4">
          <Button type="button" variant="light" onClick={onReset}>
            {t("anotherVersion")}
          </Button>
        </div>
      )}
    </section>
  );
}
