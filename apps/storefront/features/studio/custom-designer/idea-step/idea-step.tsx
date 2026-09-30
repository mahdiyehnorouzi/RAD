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
import styles from "./idea-step.module.css";
import shell from "../custom-designer.module.css";

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
    <div className={shell.cdStep}>
      <header className={shell.cdStepHead}>
        <h3>{c.ideaTitle}</h3>
        <p>{c.ideaHelp}</p>
      </header>

      {designer.uploads.length === 0 ? (
        <button
          type="button"
          className={styles.ideaDrop}
          onClick={() => photoInput.current?.click()}
        >
          <span className={styles.ideaDropIcon} aria-hidden="true">
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

      <div
        className={styles.ideaTiles}
        role="group"
        aria-label={c.ideaAttachLabel}
      >
        {tiles.map(({ id, label, icon, filled }) => (
          <button
            key={id}
            type="button"
            className={`${styles.ideaTile}${open === id ? ` ${styles.open}` : ""}`}
            aria-expanded={open === id}
            aria-controls={`idea-panel-${id}`}
            onClick={() => setOpen((current) => (current === id ? null : id))}
          >
            <StudioIcon name={icon} size={20} />
            <span>{label}</span>
            {filled ? (
              <i className={styles.ideaTileCheck} aria-hidden="true">
                <StudioIcon name="check" size={11} />
              </i>
            ) : null}
            {filled ? <span className="sr-only">— {c.attached}</span> : null}
          </button>
        ))}
      </div>

      {open === "draw" ? (
        <div id="idea-panel-draw" className={styles.ideaPanel}>
          <SparkDraw sketch={designer.sketch} onChange={designer.setSketch} />
        </div>
      ) : null}
      {open === "voice" ? (
        <div id="idea-panel-voice" className={styles.ideaPanel}>
          <SparkVoice
            hasVoice={designer.hasVoice}
            onChange={designer.setHasVoice}
          />
        </div>
      ) : null}

      <div className={styles.ideaPrompt}>
        <label className={shell.cdSublabel} htmlFor="artwork-prompt">
          {c.ideaLabel}
        </label>
        <div className={styles.ideaPromptBox}>
          <textarea
            id="artwork-prompt"
            className="resize-none"
            value={designer.prompt}
            maxLength={MAX_PROMPT}
            onChange={(event) => designer.setPrompt(event.target.value)}
            placeholder={c.ideaPlaceholder}
            aria-describedby="artwork-prompt-count"
          />
          <span id="artwork-prompt-count" className={styles.ideaCount}>
            {number(designer.prompt.length)}/{number(MAX_PROMPT)}
          </span>
        </div>
      </div>

      <IdeaCard designer={designer} />
    </div>
  );
}
