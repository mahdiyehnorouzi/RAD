import { useCallback, useEffect, useRef, useState } from "react";
import {
  BUDGET_OPTIONS,
  DEFAULT_SIZE_INDEX,
  DESIGNER_STEPS,
  FORM_OPTIONS,
  SIZE_OPTIONS,
  TIMELINE_OPTIONS,
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
  forms: [],
  sizeIndex: DEFAULT_SIZE_INDEX,
  dimensions: "",
  colors: [],
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
    draft.forms.length ||
    draft.dimensions.trim() ||
    draft.colors.length ||
    draft.budget ||
    draft.timeline,
  );
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
    ) as Partial<DesignerDraft> | null;
    if (!parsed || typeof parsed !== "object") return null;
    const step = DESIGNER_STEPS.includes(parsed.step as never)
      ? parsed.step!
      : "idea";
    const reached = DESIGNER_STEPS.includes(parsed.reached as never)
      ? parsed.reached!
      : step;
    const sizeIndex =
      typeof parsed.sizeIndex === "number" &&
      parsed.sizeIndex >= 0 &&
      parsed.sizeIndex < SIZE_OPTIONS.length
        ? Math.round(parsed.sizeIndex)
        : DEFAULT_SIZE_INDEX;
    const draft: DesignerDraft = {
      step,
      reached,
      prompt: String(parsed.prompt ?? ""),
      uploads: strings(parsed.uploads),
      sketch: String(parsed.sketch ?? ""),
      hasVoice: Boolean(parsed.hasVoice),
      forms: strings(parsed.forms).filter((id) =>
        FORM_OPTIONS.some((option) => option.id === id),
      ),
      sizeIndex,
      dimensions: String(parsed.dimensions ?? ""),
      colors: strings(parsed.colors),
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
