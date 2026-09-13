"use client";

import { useState } from "react";
import { useLocale } from "@/components/i18n";
import { DesignerImages } from "../designer-images";
import { DESIGNER_COLORS, DESIGNER_FEELINGS } from "../const";
import { SparkDraw } from "./spark-draw";
import { SparkVoice } from "./spark-voice";
import "./spark-input.css";

type SparkMode = "write" | "photo" | "draw" | "voice";

export function SparkInput({
  prompt,
  setPrompt,
  uploads,
  maxImages,
  error,
  onError,
  onAdd,
  onRemove,
  sketch,
  onSketch,
  hasVoice,
  onVoice,
  colors,
  onToggleColor,
  feeling,
  onFeeling,
}: {
  prompt: string;
  setPrompt: (value: string) => void;
  uploads: string[];
  maxImages: number;
  error: string;
  onError: (message: string) => void;
  onAdd: (files: string[]) => void;
  onRemove: (index: number) => void;
  sketch: string;
  onSketch: (value: string) => void;
  hasVoice: boolean;
  onVoice: (value: boolean) => void;
  colors: string[];
  onToggleColor: (value: string) => void;
  feeling: string;
  onFeeling: (value: string) => void;
}) {
  const { t, locale } = useLocale();
  const [mode, setMode] = useState<SparkMode>("write");
  const modes: SparkMode[] = ["write", "photo", "draw", "voice"];

  return (
    <div className="spark-input">
      <header>
        <small>{t("stepOne")}</small>
        <strong>{t("designerSparkLead")}</strong>
      </header>
      <p>{t("designerSparkHelp")}</p>

      <div className="spark-modes" role="tablist" aria-label={t("designerSparkLead")}>
        {modes.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            className={mode === id ? "active" : ""}
            onClick={() => setMode(id)}
          >
            {id === "write"
              ? t("designerWrite")
              : id === "photo"
                ? t("designerPhoto")
                : id === "draw"
                  ? t("designerDraw")
                  : t("designerVoice")}
          </button>
        ))}
      </div>

      {mode === "write" ? (
        <>
          <label htmlFor="artwork-prompt">{t("promptLabel")}</label>
          <textarea
            id="artwork-prompt"
            className="resize-none designer-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={t("designerSparkPlaceholder")}
          />
        </>
      ) : null}

      {mode === "photo" ? (
        <DesignerImages
          uploads={uploads}
          maxImages={maxImages}
          error={error}
          onError={onError}
          onAdd={onAdd}
          onRemove={onRemove}
        />
      ) : null}

      {mode === "draw" ? <SparkDraw sketch={sketch} onChange={onSketch} /> : null}
      {mode === "voice" ? <SparkVoice hasVoice={hasVoice} onChange={onVoice} /> : null}

      <fieldset className="spark-feelings">
        <legend>{t("designerFeeling")}</legend>
        <div>
          {DESIGNER_FEELINGS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={feeling === item.id ? "active" : ""}
              aria-pressed={feeling === item.id}
              onClick={() => onFeeling(feeling === item.id ? "" : item.id)}
            >
              {item.label[locale]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="spark-colors">
        <legend>{t("designerColors")}</legend>
        <small>{t("designerColorLimit")}</small>
        <div>
          {DESIGNER_COLORS.map((color) => (
            <button
              key={color.id}
              type="button"
              className={colors.includes(color.value) ? "active" : ""}
              style={{ background: color.value }}
              aria-pressed={colors.includes(color.value)}
              aria-label={color.id}
              onClick={() => onToggleColor(color.value)}
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
}
