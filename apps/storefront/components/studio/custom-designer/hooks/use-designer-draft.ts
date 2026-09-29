import { useCallback, useEffect, useRef, useState } from "react";
import {
  BUDGET_OPTIONS,
  DEFAULT_SIZE,
  DESIGNER_STEPS,
  FORM_OPTIONS,
  LEGACY_FORM_IDS,
  SIZE_OPTIONS,
  TIMELINE_OPTIONS,
  USE_OPTIONS,
} from "../const";
import type { DesignerDraft } from "../type";

const storageKey = "rad-studio-draft-v1";
const SAVE_DELAY_MS = 400;

const emptyDesignerDraft: DesignerDraft = {
  step: "idea",
  reached: "idea",
  prompt: "",
  uploads: [],
  sketch: "",
  hasVoice: false,
  form: "",
  uses: [],
  size: DEFAULT_SIZE,
  length: "",
  width: "",
  height: "",
  colors: [],
  colorNote: "",
  freedom: 70,
  budget: "",
  timeline: "",
  needBy: "",
};

function hasContent(draft: DesignerDraft) {
  return Boolean(
    draft.prompt.trim() ||
    draft.uploads.length ||
    draft.sketch ||
    draft.hasVoice ||
    draft.form ||
    draft.uses.length ||
    draft.length.trim() ||
    draft.width.trim() ||
    draft.height.trim() ||
    draft.colors.length ||
    draft.colorNote.trim() ||
    draft.budget ||
    draft.timeline,
  );
}

/** Drafts saved before the single-category studio kept `forms[]` and a five-stop `sizeIndex`. */
function legacyForm(value: unknown) {
  for (const id of strings(value)) {
    const mapped = LEGACY_FORM_IDS[id] ?? id;
    if (FORM_OPTIONS.some((option) => option.id === mapped)) return mapped;
  }
  return "";
}

function legacySize(value: unknown) {
  if (typeof value !== "number") return "";
  if (value <= 1) return "small";
  if (value <= 2) return "medium";
  return "large";
}

function strings(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function known(value: unknown, options: Array<{ id: string }>) {
  return options.some((option) => option.id === value) ? String(value) : "";
}

function readDraft(): DesignerDraft | null {
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(storageKey) ?? "null",
    ) as (Partial<DesignerDraft> & { forms?: unknown; sizeIndex?: unknown }) | null;
    if (!parsed || typeof parsed !== "object") return null;
    const step = DESIGNER_STEPS.includes(parsed.step as never)
      ? parsed.step!
      : "idea";
    const reached = DESIGNER_STEPS.includes(parsed.reached as never)
      ? parsed.reached!
      : step;
    const draft: DesignerDraft = {
      step,
      reached,
      prompt: String(parsed.prompt ?? ""),
      uploads: strings(parsed.uploads),
      sketch: String(parsed.sketch ?? ""),
      hasVoice: Boolean(parsed.hasVoice),
      form: known(parsed.form, FORM_OPTIONS) || legacyForm(parsed.forms),
      uses: strings(parsed.uses).filter((id) =>
        USE_OPTIONS.some((option) => option.id === id),
      ),
      size:
        known(parsed.size, SIZE_OPTIONS) ||
        legacySize(parsed.sizeIndex) ||
        DEFAULT_SIZE,
      length: String(parsed.length ?? ""),
      width: String(parsed.width ?? ""),
      height: String(parsed.height ?? ""),
      colors: strings(parsed.colors),
      colorNote: String(parsed.colorNote ?? ""),
      freedom: typeof parsed.freedom === "number" ? parsed.freedom : 70,
      budget: known(parsed.budget, BUDGET_OPTIONS),
      timeline: known(parsed.timeline, TIMELINE_OPTIONS),
      needBy: String(parsed.needBy ?? ""),
    };
    return hasContent(draft) ? draft : null;
  } catch {
    return null;
  }
}

function removeDraft() {
  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    /* storage unavailable */
  }
}

function writeDraft(draft: DesignerDraft) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(draft));
  } catch {
    // Quota: keep the words and choices even if the images don't fit.
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({ ...draft, uploads: [], sketch: "" }),
      );
    } catch {
      /* storage unavailable */
    }
  }
}

/**
 * Autosaves the studio on this device so a sign-in redirect, lost connection
 * or failed submit never throws the visitor's idea away.
 */
export function useDesignerDraft(
  draft: DesignerDraft,
  restore: (draft: DesignerDraft) => void,
) {
  const [restored, setRestored] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    const saved = readDraft();
    if (saved) {
      restore(saved);
      setRestored(true);
    }
    hydrated.current = true;
  }, [restore]);

  useEffect(() => {
    if (!hydrated.current) return undefined;
    const timer = window.setTimeout(() => {
      if (hasContent(draft)) writeDraft(draft);
      else removeDraft();
    }, SAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [draft]);

  /** After a successful submit: forget the draft and stop saving. */
  const clear = useCallback(() => {
    hydrated.current = false;
    removeDraft();
    setRestored(false);
  }, []);

  /** "Start over": wipe the restored draft and keep autosaving the fresh one. */
  const discard = useCallback(() => {
    removeDraft();
    setRestored(false);
    restore(emptyDesignerDraft);
  }, [restore]);

  /** After a sent idea, begin a new one and resume autosaving. */
  const reset = useCallback(() => {
    restore(emptyDesignerDraft);
    hydrated.current = true;
  }, [restore]);

  return { restored, clear, discard, reset };
}
