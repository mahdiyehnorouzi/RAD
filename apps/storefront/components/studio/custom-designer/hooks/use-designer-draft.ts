import { useCallback, useEffect, useRef, useState } from "react";
import { artworkCategoryById } from "@/lib/catalog/artwork";
import { DESIGNER_STEPS } from "../const";
import type { DesignerDraft } from "../type";

const storageKey = "rad-studio-draft-v1";
const SAVE_DELAY_MS = 400;

const emptyDesignerDraft: DesignerDraft = {
  step: "spark",
  reached: "spark",
  category: "",
  prompt: "",
  intendedUse: "",
  dimensions: "",
  budget: "",
  uploads: [],
  sketch: "",
  hasVoice: false,
  colors: [],
  feeling: "",
  freedom: 70,
};

function hasContent(draft: DesignerDraft) {
  return Boolean(
    draft.prompt.trim() ||
    draft.intendedUse.trim() ||
    draft.dimensions.trim() ||
    draft.budget.trim() ||
    draft.uploads.length ||
    draft.sketch ||
    draft.colors.length ||
    draft.feeling ||
    draft.category,
  );
}

function readDraft(): DesignerDraft | null {
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(storageKey) ?? "null",
    ) as Partial<DesignerDraft> | null;
    if (!parsed || typeof parsed !== "object") return null;
    const step = DESIGNER_STEPS.includes(parsed.step as never)
      ? parsed.step!
      : "spark";
    const reached = DESIGNER_STEPS.includes(parsed.reached as never)
      ? parsed.reached!
      : step;
    const draft: DesignerDraft = {
      step,
      reached,
      category:
        parsed.category && artworkCategoryById(parsed.category)
          ? parsed.category
          : "",
      prompt: String(parsed.prompt ?? ""),
      intendedUse: String(parsed.intendedUse ?? ""),
      dimensions: String(parsed.dimensions ?? ""),
      budget: String(parsed.budget ?? ""),
      uploads: Array.isArray(parsed.uploads)
        ? parsed.uploads.filter((item) => typeof item === "string")
        : [],
      sketch: String(parsed.sketch ?? ""),
      hasVoice: Boolean(parsed.hasVoice),
      colors: Array.isArray(parsed.colors)
        ? parsed.colors.filter((item) => typeof item === "string")
        : [],
      feeling: String(parsed.feeling ?? ""),
      freedom: typeof parsed.freedom === "number" ? parsed.freedom : 70,
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

  return { restored, clear, discard };
}
