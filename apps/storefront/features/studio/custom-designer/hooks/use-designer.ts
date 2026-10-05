import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DATED_TIMELINE,
  DEFAULT_SIZE,
  DESIGNER_STEPS,
  MAX_DESIGNER_COLORS,
  type DesignerStep,
} from "../const";
import type { FlowScreen } from "../type/flow-screen";
import type { DesignerDraft } from "../type";

const maxImages = 4;
export const MAX_PROMPT = 500;

function normalizedNumber(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

export function validDimension(value: string) {
  if (!value.trim()) return true;
  const number = Number(normalizedNumber(value));
  return Number.isFinite(number) && number > 0;
}

export function validFutureDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.valueOf()) && date > new Date();
}

export function freedomToPermission(value: number) {
  if (value <= 33) return "faithful";
  if (value <= 66) return "hand";
  return "material";
}

export function useDesigner() {
  const [flowScreen, setFlowScreen] = useState<FlowScreen>("choose");
  const [step, setStep] = useState<DesignerStep>("idea");
  const [reached, setReached] = useState<DesignerStep>("idea");
  const [prompt, setPrompt] = useState("");
  const [uploads, setUploads] = useState<string[]>([]);
  const [sketch, setSketch] = useState("");
  const [hasVoice, setHasVoice] = useState(false);
  const [voice, setVoiceData] = useState("");
  const setVoice = (value: string) => {
    setVoiceData(value);
    setHasVoice(Boolean(value));
  };
  const [form, setForm] = useState("");
  const [uses, setUses] = useState<string[]>([]);
  const [size, setSize] = useState(DEFAULT_SIZE);
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [colors, setColors] = useState<string[]>([]);
  const [colorNote, setColorNote] = useState("");
  const [freedom, setFreedom] = useState(50);
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
  const hasSpark = Boolean(
    prompt.trim() || uploads.length || sketch || hasVoice,
  );

  const canAdvance = useMemo(() => {
    if (step === "idea") return hasSpark;
    if (step === "form") return Boolean(form);
    if (step === "details")
      return [length, width, height].every(validDimension);
    if (step === "plan")
      return Boolean(
        budget &&
        timeline &&
        (timeline !== DATED_TIMELINE || validFutureDate(needBy)),
      );
    return agreed;
  }, [
    agreed,
    budget,
    form,
    hasSpark,
    height,
    length,
    needBy,
    step,
    timeline,
    width,
  ]);

  const canSubmit =
    hasSpark &&
    Boolean(form) &&
    [length, width, height].every(validDimension) &&
    Boolean(
      budget &&
      timeline &&
      (timeline !== DATED_TIMELINE || validFutureDate(needBy)),
    ) &&
    agreed;

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

  /** A category card on the page picks the form (and maybe a use) before the flow starts. */
  const preselect = useCallback((nextForm: string, use?: string) => {
    setForm(nextForm);
    if (use)
      setUses((current) =>
        current.includes(use) ? current : [...current, use],
      );
  }, []);

  function toggleUse(id: string) {
    setUses((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
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
      flowScreen,
      step,
      reached,
      prompt,
      uploads,
      sketch,
      hasVoice,
      voice,
      form,
      uses,
      size,
      length,
      width,
      height,
      colors,
      colorNote,
      freedom,
      budget,
      timeline,
      needBy,
    }),
    [
      flowScreen,
      step,
      reached,
      prompt,
      uploads,
      sketch,
      hasVoice,
      voice,
      form,
      uses,
      size,
      length,
      width,
      height,
      colors,
      colorNote,
      freedom,
      budget,
      timeline,
      needBy,
    ],
  );

  const restoreDraft = useCallback((next: DesignerDraft) => {
    setFlowScreen(next.flowScreen ?? "choose");
    setStep(next.step);
    setReached(next.reached);
    setPrompt(next.prompt.slice(0, MAX_PROMPT));
    setUploads(next.uploads.slice(0, maxImages));
    setSketch(next.sketch);
    setHasVoice(Boolean(next.voice));
    setVoiceData(next.voice ?? "");
    setForm(next.form);
    setUses(next.uses);
    setSize(next.size);
    setLength(next.length);
    setWidth(next.width);
    setHeight(next.height);
    setColors(next.colors.slice(0, MAX_DESIGNER_COLORS));
    setColorNote(next.colorNote);
    setFreedom(next.freedom);
    setBudget(next.budget);
    setTimeline(next.timeline);
    setNeedBy(next.needBy);
    setAgreed(false);
    setError("");
  }, []);

  return {
    flowScreen,
    setFlowScreen,
    draft,
    voice,
    setVoice,
    restoreDraft,
    addUploads,
    agreed,
    budget,
    canAdvance,
    canSubmit,
    chooseTimeline,
    colorNote,
    colors,
    error,
    form,
    freedom,
    goBack,
    goNext,
    goTo,
    hasVoice,
    height,
    ideaNumber,
    length,
    maxImages,
    needBy,
    preselect,
    prompt,
    reachedIndex,
    removeUpload,
    setAgreed,
    setBudget,
    setColorNote,
    setError,
    setForm,
    setFreedom,
    setHasVoice,
    setHeight,
    setLength,
    setNeedBy,
    setPrompt,
    setSize,
    setSketch,
    setWidth,
    size,
    sketch,
    step,
    stepIndex,
    timeline,
    toggleColor,
    toggleUse,
    uploads,
    uses,
    width,
  };
}

export type Designer = ReturnType<typeof useDesigner>;
