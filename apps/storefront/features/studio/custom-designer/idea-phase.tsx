"use client";

import { useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, ImagePlus, Mic, Pencil, Plus } from "lucide-react";
import { useLocale } from "@/components/i18n";
import type { Designer } from "./hooks";
import { DesignerImages } from "./idea-step/designer-images";
import { OrderVoice } from "./order-voice";
import { FORM_OPTIONS } from "./const";
import styles from "./idea-phase.module.css";

type RowId = "write" | "photo" | "voice";

const EXAMPLES: Array<[string, string]> = [
  ["مثلاً یک ماگ بزرگ", "A big mug, for example"],
  ["دسته‌اش شبیه دم نهنگ باشه", "With a whale-tail handle"],
  ["رنگش مات و خاکی باشه", "In a matte earthy color"],
];

export function IdeaPhase({
  designer: d,
  onContinue,
}: {
  designer: Designer;
  onContinue: () => void;
}) {
  const { locale, number } = useLocale();
  const fa = locale === "fa";
  const txt = (faText: string, en: string) => (fa ? faText : en);
  const [open, setOpen] = useState<RowId | null>("write");
  const input = useRef<HTMLInputElement>(null);
  const hasIdea = Boolean(
    d.prompt.trim() || d.uploads.length || d.sketch || d.voice,
  );

  const rows: Array<{
    id: RowId;
    icon: typeof Pencil;
    image: string;
    title: string;
    desc: string;
    filled: boolean;
    content: ReactNode;
  }> = [
    {
      id: "write",
      icon: Pencil,
      image: "/studio/sketch.webp",
      title: txt("بنویس", "Write"),
      desc: txt("هر چی تو ذهنته", "Whatever is on your mind"),
      filled: Boolean(d.prompt.trim()),
      content: (
        <>
          <div className={styles.examples} role="list">
            {EXAMPLES.map(([faText, en]) => {
              const value = txt(faText, en);
              return (
                <button
                  key={value}
                  type="button"
                  role="listitem"
                  onClick={() =>
                    d.setPrompt(
                      [d.prompt, value].filter(Boolean).join(" ").slice(0, 500),
                    )
                  }
                >
                  {value}
                </button>
              );
            })}
          </div>
          <label className={styles.textField}>
            <span className="sr-only">{txt("بنویس", "Write")}</span>
            <textarea
              value={d.prompt}
              onChange={(e) => d.setPrompt(e.target.value)}
              maxLength={500}
              placeholder={txt("ایده‌ات رو بنویس…", "Write your idea…")}
            />
            <small>
              {number(d.prompt.length)}/{number(500)}
            </small>
          </label>
        </>
      ),
    },
    {
      id: "photo",
      icon: ImagePlus,
      image: "/studio/bowl.webp",
      title: txt("عکس بفرست", "Send a photo"),
      desc: txt(
        "عکس، طرح یا هر چیزی که کمک می‌کنه",
        "A photo, sketch, or anything that helps",
      ),
      filled: Boolean(d.uploads.length || d.sketch),
      content: (
        <>
          <button
            type="button"
            className={styles.upload}
            onClick={() => input.current?.click()}
          >
            <Plus aria-hidden="true" />
            <span>{txt("عکس انتخاب کن", "Choose a photo")}</span>
          </button>
          <DesignerImages
            inputRef={input}
            uploads={d.uploads}
            maxImages={d.maxImages}
            error={d.error}
            onError={d.setError}
            onAdd={d.addUploads}
            onRemove={d.removeUpload}
          />
          <div className={styles.referenceExamples}>
            {[FORM_OPTIONS[0].image, "/studio/bowl.webp", "/studio/sketch.webp"].map(
              (src) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={src} src={src} alt="" />
              ),
            )}
          </div>
          <p className={styles.note}>
            {txt(
              "از پینترست، عکس خودت یا یک طرح دستی…",
              "Pinterest, your own photo, or a hand-drawn sketch…",
            )}
          </p>
        </>
      ),
    },
    {
      id: "voice",
      icon: Mic,
      image: "/studio/window.webp",
      title: txt("بگو", "Say it"),
      desc: txt("اگه گفتنش راحت‌تره", "If it’s easier to say it out loud"),
      filled: Boolean(d.voice),
      content: <OrderVoice value={d.voice} onChange={d.setVoice} />,
    },
  ];

  return (
    <div className={styles.idea}>
      <h1 className={styles.title}>
        {txt("چه ایده‌ای داری؟", "What do you have in mind?")}
      </h1>
      <p className={styles.hint}>
        {txt(
          "به هر روشی که راحت‌تری برامون بگو. می‌تونی چند روش رو با هم استفاده کنی.",
          "Tell us however you prefer — you can combine more than one.",
        )}
      </p>
      <div className={styles.rows}>
        {rows.map((row) => {
          const expanded = open === row.id;
          const Icon = row.icon;
          return (
            <div key={row.id} className={styles.row} data-expanded={expanded}>
              <button
                type="button"
                className={styles.rowHead}
                aria-expanded={expanded}
                aria-controls={`idea-panel-${row.id}`}
                onClick={() => setOpen(expanded ? null : row.id)}
              >
                <span className={styles.rowThumb}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={row.image} alt="" />
                  <i className={styles.rowThumbIcon} data-filled={row.filled}>
                    <Icon aria-hidden="true" />
                  </i>
                </span>
                <span className={styles.rowText}>
                  <b>{row.title}</b>
                  <small>{row.desc}</small>
                </span>
                {row.filled && (
                  <Check className={styles.rowCheck} aria-hidden="true" />
                )}
                <ChevronDown className={styles.rowChevron} aria-hidden="true" />
              </button>
              {expanded && (
                <div id={`idea-panel-${row.id}`} className={styles.rowPanel}>
                  {row.content}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        className={styles.cta}
        disabled={!hasIdea}
        onClick={onContinue}
      >
        {txt("بریم برای انتخاب‌ها", "Let’s make some choices")}
      </button>
    </div>
  );
}
