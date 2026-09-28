"use client";

import { useState } from "react";
import { Check, ImagePlus, Mic, PenLine } from "lucide-react";
import { useLocale } from "@/components/i18n";
import { designerCopy } from "../const";
import type { Designer } from "../hooks";
import { DesignerImages } from "./designer-images";
import { SparkDraw } from "./spark-draw";
import { SparkVoice } from "./spark-voice";
import "./idea-step.css";

type Attachment = "photo" | "draw" | "voice";

export function IdeaStep({ designer }: { designer: Designer }) {
  const { t, locale } = useLocale();
  const c = designerCopy[locale];
  const [open, setOpen] = useState<Attachment | null>(null);
  const attachments: Array<{
    id: Attachment;
    label: string;
    Icon: typeof ImagePlus;
    filled: boolean;
  }> = [
    { id: "photo", label: c.addPhoto, Icon: ImagePlus, filled: designer.uploads.length > 0 },
    { id: "draw", label: c.addDrawing, Icon: PenLine, filled: Boolean(designer.sketch) },
    { id: "voice", label: c.addVoice, Icon: Mic, filled: designer.hasVoice },
  ];

  return (
    <div className="designer-step idea-step">
      <header className="designer-step-head">
        <h3>{c.ideaTitle}</h3>
        <p>{c.ideaHelp}</p>
      </header>

      <label className="sr-only" htmlFor="artwork-prompt">
        {c.ideaLabel}
      </label>
      <textarea
        id="artwork-prompt"
        className="resize-none designer-prompt"
        value={designer.prompt}
        onChange={(event) => designer.setPrompt(event.target.value)}
        placeholder={t("designerSparkPlaceholder")}
      />

      <div className="idea-attach" role="group" aria-label={c.ideaLabel}>
        {attachments.map(({ id, label, Icon, filled }) => (
          <button
            key={id}
            type="button"
            className={`${open === id ? "is-open" : ""}${filled ? " is-filled" : ""}`}
            aria-expanded={open === id}
            aria-controls={`idea-attach-${id}`}
            onClick={() => setOpen((current) => (current === id ? null : id))}
          >
            {filled ? (
              <Check aria-hidden="true" size={16} strokeWidth={1.6} />
            ) : (
              <Icon aria-hidden="true" size={16} strokeWidth={1.6} />
            )}
            <span>{label}</span>
            {filled ? <span className="sr-only">— {c.attached}</span> : null}
          </button>
        ))}
      </div>

      {open === "photo" ? (
        <div id="idea-attach-photo" className="idea-attach-panel">
          <DesignerImages
            uploads={designer.uploads}
            maxImages={designer.maxImages}
            error={designer.error}
            onError={designer.setError}
            onAdd={designer.addUploads}
            onRemove={designer.removeUpload}
          />
        </div>
      ) : null}
      {open === "draw" ? (
        <div id="idea-attach-draw" className="idea-attach-panel">
          <SparkDraw sketch={designer.sketch} onChange={designer.setSketch} />
        </div>
      ) : null}
      {open === "voice" ? (
        <div id="idea-attach-voice" className="idea-attach-panel">
          <SparkVoice hasVoice={designer.hasVoice} onChange={designer.setHasVoice} />
        </div>
      ) : null}
    </div>
  );
}
