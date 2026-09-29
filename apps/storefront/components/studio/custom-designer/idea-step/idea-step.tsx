"use client";

import { useRef, useState } from "react";
import { useLocale } from "@/components/i18n";
import { StudioIcon } from "../../studio-icon";
import { designerCopy } from "../const";
import { MAX_PROMPT, type Designer } from "../hooks";
import { DesignerImages } from "./designer-images";
import { IdeaCard } from "./idea-card";
import { SparkDraw } from "./spark-draw";
import { SparkVoice } from "./spark-voice";
import "./idea-step.css";

type Panel = "draw" | "voice";

export function IdeaStep({ designer }: { designer: Designer }) {
  const { locale, number } = useLocale();
  const c = designerCopy[locale];
  const [open, setOpen] = useState<Panel | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);

  const tiles = [
    {
      id: "draw" as const,
      label: c.addDrawing,
      icon: "edit" as const,
      filled: Boolean(designer.sketch),
    },
    {
      id: "voice" as const,
      label: c.addVoice,
      icon: "microphone" as const,
      filled: designer.hasVoice,
    },
  ];

  return (
    <div className="cd-step idea-step">
      <header className="cd-step-head">
        <h3>{c.ideaTitle}</h3>
        <p>{c.ideaHelp}</p>
      </header>

      {designer.uploads.length === 0 ? (
        <button
          type="button"
          className="idea-drop"
          onClick={() => photoInput.current?.click()}
        >
          <span className="idea-drop-icon" aria-hidden="true">
            <StudioIcon name="upload" size={24} />
          </span>
          <strong>{c.uploadTitle}</strong>
          <small>{c.uploadHint}</small>
        </button>
      ) : null}

      <DesignerImages
        inputRef={photoInput}
        uploads={designer.uploads}
        maxImages={designer.maxImages}
        error={designer.error}
        onError={designer.setError}
        onAdd={designer.addUploads}
        onRemove={designer.removeUpload}
      />

      <div className="idea-tiles" role="group" aria-label={c.ideaAttachLabel}>
        {tiles.map(({ id, label, icon, filled }) => (
          <button
            key={id}
            type="button"
            className={`idea-tile${open === id ? " is-open" : ""}${filled ? " is-filled" : ""}`}
            aria-expanded={open === id}
            aria-controls={`idea-panel-${id}`}
            onClick={() => setOpen((current) => (current === id ? null : id))}
          >
            <StudioIcon name={icon} size={20} />
            <span>{label}</span>
            {filled ? (
              <i className="idea-tile-check" aria-hidden="true">
                <StudioIcon name="check" size={11} />
              </i>
            ) : null}
            {filled ? <span className="sr-only">— {c.attached}</span> : null}
          </button>
        ))}
      </div>

      {open === "draw" ? (
        <div id="idea-panel-draw" className="idea-panel">
          <SparkDraw sketch={designer.sketch} onChange={designer.setSketch} />
        </div>
      ) : null}
      {open === "voice" ? (
        <div id="idea-panel-voice" className="idea-panel">
          <SparkVoice hasVoice={designer.hasVoice} onChange={designer.setHasVoice} />
        </div>
      ) : null}

      <div className="idea-prompt">
        <label className="cd-sublabel" htmlFor="artwork-prompt">
          {c.ideaLabel}
        </label>
        <div className="idea-prompt-box">
          <textarea
            id="artwork-prompt"
            className="resize-none"
            value={designer.prompt}
            maxLength={MAX_PROMPT}
            onChange={(event) => designer.setPrompt(event.target.value)}
            placeholder={c.ideaPlaceholder}
            aria-describedby="artwork-prompt-count"
          />
          <span id="artwork-prompt-count" className="idea-count">
            {number(designer.prompt.length)}/{number(MAX_PROMPT)}
          </span>
        </div>
      </div>

      <IdeaCard designer={designer} />
    </div>
  );
}
