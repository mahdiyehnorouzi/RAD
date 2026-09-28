import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DATED_TIMELINE,
  DEFAULT_SIZE_INDEX,
  DESIGNER_STEPS,
  MAX_DESIGNER_COLORS,
  UNSURE_FORM,
  type DesignerStep,
} from "../const";
import type { DesignerDraft } from "../type";

const maxImages = 4;

export function freedomToPermission(value: number) {
  if (value <= 33) return "faithful";
  if (value <= 66) return "hand";
  return "material";
}

export function useDesigner() {
  const [step, setStep] = useState<DesignerStep>("idea");
  const [reached, setReached] = useState<DesignerStep>("idea");
  const [prompt, setPrompt] = useState("");
  const [uploads, setUploads] = useState<string[]>([]);
  const [sketch, setSketch] = useState("");
  const [hasVoice, setHasVoice] = useState(false);
  const [forms, setForms] = useState<string[]>([]);
  const [sizeIndex, setSizeIndex] = useState(DEFAULT_SIZE_INDEX);
  const [dimensions, setDimensions] = useState("");
  const [colors, setColors] = useState<string[]>([]);
  const [freedom, setFreedom] = useState(70);
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [needBy, setNeedBy] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [ideaNumber, setIdeaNumber] = useState(24);
  useEffect(() => {
    setIdeaNumber(18 + Math.floor(Math.random() * 40));
  }, []);
  const stepIndex = DESIGNER_STEPS.indexOf(step);
  const reachedIndex = DESIGNER_STEPS.indexOf(reached);
  const hasSpark = Boolean(prompt.trim() || uploads.length || sketch || hasVoice);

  const canAdvance = useMemo(() => {
    if (step === "idea") return hasSpark;
    if (step === "form") return forms.length > 0;
    if (step === "details") return true;
    if (step === "plan")
      return Boolean(budget && timeline && (timeline !== DATED_TIMELINE || needBy.trim()));
    return agreed;
  }, [agreed, budget, forms.length, hasSpark, needBy, step, timeline]);

  function goTo(next: DesignerStep) {
    const nextIndex = DESIGNER_STEPS.indexOf(next);
    if (nextIndex > reachedIndex + 1) return;
    setStep(next);
    if (nextIndex > reachedIndex) setReached(next);
  }

  function goNext() {
    const next = DESIGNER_STEPS[stepIndex + 1];
    if (!next || !canAdvance) return;
    goTo(next);
  }

  function goBack() {
    const prev = DESIGNER_STEPS[stepIndex - 1];
    if (prev) setStep(prev);
  }

  /** "I don't know" stands alone: picking it clears the rest, and vice versa. */
  function toggleForm(id: string) {
    setForms((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (id === UNSURE_FORM) return [UNSURE_FORM];
      return [...current.filter((item) => item !== UNSURE_FORM), id];
    });
  }

  function toggleColor(value: string) {
    setColors((current) => {
      if (current.includes(value))
        return current.filter((item) => item !== value);
      if (current.length >= MAX_DESIGNER_COLORS) return current;
      return [...current, value];
    });
  }

  function addUploads(files: string[]) {
    setUploads((current) => [...current, ...files].slice(0, maxImages));
  }

  function removeUpload(index: number) {
    setUploads((current) => current.filter((_, item) => item !== index));
  }

  function chooseTimeline(id: string) {
    setTimeline(id);
    if (id !== DATED_TIMELINE) setNeedBy("");
  }

  const draft = useMemo<DesignerDraft>(
    () => ({
      step,
      reached,
      prompt,
      uploads,
      sketch,
      hasVoice,
      forms,
      sizeIndex,
      dimensions,
      colors,
      freedom,
      budget,
      timeline,
      needBy,
    }),
    [
      step,
      reached,
      prompt,
      uploads,
      sketch,
      hasVoice,
      forms,
      sizeIndex,
      dimensions,
      colors,
      freedom,
      budget,
      timeline,
      needBy,
    ],
  );

  const restoreDraft = useCallback((next: DesignerDraft) => {
    setStep(next.step);
    setReached(next.reached);
    setPrompt(next.prompt);
    setUploads(next.uploads.slice(0, maxImages));
    setSketch(next.sketch);
    setHasVoice(next.hasVoice);
    setForms(next.forms);
    setSizeIndex(next.sizeIndex);
    setDimensions(next.dimensions);
    setColors(next.colors.slice(0, MAX_DESIGNER_COLORS));
    setFreedom(next.freedom);
    setBudget(next.budget);
    setTimeline(next.timeline);
    setNeedBy(next.needBy);
    setAgreed(false);
    setError("");
  }, []);

  return {
    draft,
    restoreDraft,
    addUploads,
    agreed,
    budget,
    canAdvance,
    chooseTimeline,
    colors,
    dimensions,
    error,
    forms,
    freedom,
    goBack,
    goNext,
    goTo,
    hasVoice,
    ideaNumber,
    maxImages,
    needBy,
    prompt,
    reachedIndex,
    removeUpload,
    setAgreed,
    setBudget,
    setDimensions,
    setError,
    setFreedom,
    setHasVoice,
    setNeedBy,
    setPrompt,
    setSizeIndex,
    setSketch,
    sizeIndex,
    sketch,
    step,
    stepIndex,
    timeline,
    toggleColor,
    toggleForm,
    uploads,
  };
}

export type Designer = ReturnType<typeof useDesigner>;
